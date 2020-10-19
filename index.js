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
   */
  register(fn) {
    // register sms action
    fn('page', CalendarPage);
  }
}

// create new
module.exports = new CalendarModule();
