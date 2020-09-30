// require first
const { Module } = require('@dashup/module');

// import base
const CalendarPage = require('./pages/calendar');

/**
 * export module
 */
class CalendarModule extends Module {

  /**
   * construct discord module
   */
  constructor() {
    // run super
    super();
  }
  
  /**
   * Register all page interfaces here
   * 
   * ```
   * // register connect class
   * register(Page);
   * ```
   * 
   * Class `Page` should extend `require('@dashup/module').Page`
   * 
   * @param {Function} register 
   */
  pages(register) {
    // register sms action
    register(CalendarPage);
  }
}

// create new
module.exports = new CalendarModule();
