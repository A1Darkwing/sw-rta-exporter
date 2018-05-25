const fs = require('fs');
const path = require('path');
const eol = require('os').EOL;
const mockRTA = require('./../mock/mockRTA');
const profileExport = require('./profile-export');
const sanitize = require('sanitize-filename');

module.exports = {
  defaultConfig: {
    enabled: true
  },
  pluginName: 'RTAPlugin',
  pluginDescription: 'This plugin shows you all Information about the enemies',
  init(proxy) {
    proxy.on('apiCommand', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        this.processCommand(proxy, req, resp);
      }
    });
  },
  processCommand(proxy, req, resp) {
    const { command } = req;
    let enemiesList = [];

    // Extract the rune and display it's efficiency stats.
    switch (command) {
      case 'BattleRTPvPStart':
        resp.battle_info.users.forEach((user) => {
          if(profileExport.profileName != '') {
            if(user.wizard_name != profileExport.profileName) {
              enemiesList.push(this.logRTA(user.units));
            }
          } else {
            proxy.log({
              type: 'error',
              source: 'plugin',
              name: this.pluginName,
              message: 'Can not read profile. Please restart Summoners War Game'
            });
          }
        });
        break;
      default:
        break;
    }

    //If enemies is not empty then log 
    if (enemiesList.length > 0) {
      proxy.log({
        type: 'success',
        source: 'plugin',
        name: this.pluginName,
        message: this.mountEnemiesListHtml(enemiesList)
      });
    }
  },

  logRTAFile(units) {
    let example = JSON.parse(mockRTA.getMockRTA());

    example.unit_list = [];
    units.forEach((unit) => {
      let monsterName = gMapping.getMonsterName(unit.unit.unit_master_id);
      example.unit_list.push(unit.unit);
    });

    let rtaFileNname = sanitize(`RTA-${profileExport.profileName}`).concat('.json');
    let logfile = fs.createWriteStream(
      path.join(config.Config.App.filesPath, rtaFileNname), {
        flags: 'w',
        autoClose: true
      }
    );

    logfile.write(JSON.stringify(example, true, 2));
    logfile.end();

  },

  logRTA(units) {
    this.logRTAFile(units);
    
    let rtaFileNname = sanitize(`RTA-${profileExport.profileName}`).concat('.json');

    let message = 'The enemy monsters : <br/>';
    units.forEach((unit) => {
      let monsterName = gMapping.getMonsterName(unit.unit.unit_master_id);
      let monsterDetails = gMapping.getMonsterInfo(unit.unit.unit_master_id);
      let monsterUrl = 'https://swarfarm.com/static/herders/images/monsters/' + monsterDetails.image_filename;
      let mes = `<div class="rune item">
      <div class="ui image label">
        <img src="${monsterUrl}" />
      </div>`;
      mes = mes.concat(`<div class="content">
      <div class="header">${monsterName}</div>
      <div class="description"></div>
    </div>
  </div>`);

      message = message.concat(mes);
    });

    return message + `Saved profile data to ${rtaFileNname}.`;
  },

  mountStarsHtml(rune) {
    let count = 0;
    let html = '<div class="star-line">';

    while (count < rune.class) {
      html = html.concat('<span class="star"><img src="../assets/icons/star-unawakened.png" /></span>');
      count += 1;
    }

    return html.concat('</div>');
  },

  mountEnemiesListHtml(units) {
    let message = '<div class="runes ui list relaxed">';

    units.forEach((unit) => {
      message = message.concat(unit);
    });

    return message.concat('</div>');
  }

};
