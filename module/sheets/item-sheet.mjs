import { THEWATCH } from "../helpers/config.mjs";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class TheWatchItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["thewatch", "sheet", "item"],
      width: 800,
      height: 520,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/thewatch/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    return `${path}/item-${this.item.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item.data;

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = itemData.data;
    context.flags = itemData.flags;
    context.cfg = THEWATCH;

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find('#advance').click(ev => {
      const id = this.item.data._id
      const halfCircle = document.querySelectorAll(`#item-${id} .half-circle`);
      const halfCircleTop = document.querySelectorAll(`#item-${id} .half-circle-top`);
      const data = this.item.data.data;

      if (Number(data.currentFill) < 360) {
        let pie = Number(data.currentFill) + Number(data.increment);

        halfCircle.forEach(circle => {
          circle.style.transform = `rotate(${pie}deg)`
          if(pie >= 180) {
              halfCircle[0].style.transform = `rotate(180deg)`
              halfCircleTop[0].style.opacity = '0'
          } else {
              halfCircleTop[0].style.opacity = '1'
          }
        })

        this.item.update({ "data.currentFill" : pie });
      }
    });

    html.find('#decrement').click(ev => {
      const id = this.item.data._id
      const halfCircle = document.querySelectorAll(`#item-${id} .half-circle`);
      const halfCircleTop = document.querySelectorAll(`#item-${id} .half-circle-top`);
      const data = this.item.data.data;

      if (Number(data.currentFill) > 0) {
        let pie = Number(data.currentFill) - Number(data.increment);

        halfCircle.forEach(circle => {
          circle.style.transform = `rotate(${pie}deg)`
          if(pie >= 180) {
              halfCircle[0].style.transform = `rotate(180deg)`
              halfCircleTop[0].style.opacity = '0'
          } else {
              halfCircleTop[0].style.opacity = '1'
          }
        })

        this.item.update({ "data.currentFill" : pie });
      }
    });

    html.find('#segments').change(ev => {
      const id = this.item.data._id
      const halfCircle = document.querySelectorAll(`#item-${id} .half-circle`);
      const halfCircleTop = document.querySelectorAll(`#item-${id} .half-circle-top`);

      switch(ev.currentTarget.value) {
        case "3":
            this.item.update({"data.clockImg" : "ThreeClock.svg", "data.increment" : "120", "data.currentFill" : "0"});
            break;
        case "4":
            this.item.update({"data.clockImg" : "FourClock.svg", "data.increment" : "90", "data.currentFill" : "0"});
            break;
        case "6":
            this.item.update({"data.clockImg" : "SixClock.svg", "data.increment" : "60", "data.currentFill" : "0"});
            break;
        case "8":
            this.item.update({"data.clockImg" : "EightClock.svg", "data.increment" : "45", "data.currentFill" : "0"});
            break;
        case "9":
            this.item.update({"data.clockImg" : "NineClock.svg", "data.increment" : "40", "data.currentFill" : "0"});
            break;
        case "10":
            this.item.update({"data.clockImg" : "TenClock.svg", "data.increment" : "36", "data.currentFill" : "0"});
            break;
        case "12":
            this.item.update({"data.clockImg" : "TwelveClock.svg", "data.increment" : "30", "data.currentFill" : "0"});
            break;
        default:
      }

      halfCircle.forEach(circle => {
        circle.style.transform = `rotate(0deg)`
      });

      halfCircleTop[0].style.opacity = '1'
      this.render()
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.
  }

}
