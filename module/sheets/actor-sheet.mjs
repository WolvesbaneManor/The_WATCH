import { THEWATCH } from "../helpers/config.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class TheWatchActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["thewatch", "sheet", "actor"],
      template: "systems/thewatch/templates/actor/actor-sheet.html",
      width: 800,
      height: 675,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
    });
  }

  /** @override */
  get template() {
    return `systems/thewatch/templates/actor/actor-${this.actor.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.actor.data;

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = actorData.data;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();
    context.cfg = THEWATCH;

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle aspect scores.
    for (let [k, v] of Object.entries(context.data.aspects)) {
      v.label = game.i18n.localize(CONFIG.THEWATCH.aspects[k]) ?? k;
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const skills = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      if (i.type === 'item') {
        gear.push(i);
      }
      // Append to skills.
      else if (i.type === 'skill') {
        skills.push(i);
      }
    }

    if (skills.length == 0) {
      const itemData = {
        name: "Unskilled",
        type: "skill",
        img: "systems/thewatch/images/icons/shrug.svg",
        data: {"description":"For use when performing an action without an applicable skill.", "edit": false, "formula":"d4"}
      };
      Item.create(itemData, {parent: this.actor});
    }

    // Assign and return
    context.gear = gear;
    context.skills = skills;
   }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Rollable aspects.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.owner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);

        let d = new Dialog({
          title: "Select Aspect",
          content: "<p>Select an aspect to apply to this roll.</p>",
          buttons: {
           one: {
            icon: '<i class="fas fa-theater-masks"></i>',
            label: "Emotional",
            callback: () => {
              let r = new Roll(item.data.data.formula + "+@emo.value", item.getRollData())
              r.toMessage()
            }
           },
           two: {
            icon: '<i class="fas fa-book-open"></i>',
            label: "Intellectual",
            callback: () => {
              let r = new Roll(item.data.data.formula + "+@int.value", item.getRollData())
              r.toMessage()
            }
           },
           three: {
            icon: '<i class="fas fa-heartbeat"></i>',
            label: "Physical",
            callback: () => {
              let r = new Roll(item.data.data.formula + "+@phy.value", item.getRollData())
              r.toMessage()
            }
           },
           four: {
            icon: '<i class="fas fa-at"></i>',
            label: "Social",
            callback: () => {
              let r = new Roll(item.data.data.formula + "+@soc.value", item.getRollData())
              r.toMessage()
            }
           },
           five: {
            icon: '<i class="fas fa-pastafarianism"></i>',
            label: "Spiritual",
            callback: () => {
              let r = new Roll(item.data.data.formula + "+@sprt.value", item.getRollData())
              r.toMessage()
            }
           }
          },
          default: "two",
          // render: html => console.log("Register interactivity in the rendered dialog"),
          // close: html => console.log("This always is logged no matter which option is chosen")
         });
         d.render(true);
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[aspect] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData()).roll();
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

}
