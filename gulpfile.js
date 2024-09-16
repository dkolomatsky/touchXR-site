// Подключаем библиотеки с помощью свойства require('')
// делаем деструктуризацию обьекта gulp у которого были функции {src, dest, task,watch} (чтобы минимизировать код завели под какждую свою константу)
// у gulp есть свои методы обработки файлов series (последовательно обаратывается сначала один потом другой файл) и parallel (файлы обрабатываются паралельно)
const { src, dest, task, watch, series, parallel } = require("gulp"); // подключили библиотеку gulp
// Подключаем все установленные плагины
const sass = require("gulp-sass")(require("sass")); // плагин gulp-sass (для кампиляции) ((require('sass')) надо было добавить по рекомендации vscoda)
const browserSync = require("browser-sync").create(); // плагин для обновления данных в окне браузера

// для создания минифицированых файлов устанавливаем плагины: cssnano, gulp-rename, gulp-postcss через коменд строку npm i -D (cssnano - для минификации,gulp-rename для переименования файлов и gulp-postcss нужен чтобы использовать файлы не предназначенные для работы с gulp)
const cssnamo = require("cssnano");
const rename = require("gulp-rename");
const postcss = require("gulp-postcss");
// для причесывания кода к кодстайлу используется плагин csscomb
const csscomb = require("gulp-csscomb");
// для подключения вендерных префиксов (для поддержки старых браузеров) ставим плагин autoprefixer
const autoprefixer = require("autoprefixer");
const mqpacker = require("css-mqpacker"); // плагин для работы с медиазапросами (их сортировки но он не сортирует max-width)
const sortCSSmq = require("sort-css-media-queries"); // плагин для сортировки всех запросов и max-width тоже
// плагины для работы с JS -------------------------------------------------------------
const terser = require("gulp-terser"); // нужен для минификации JS
const concat = require("gulp-concat"); // нужен для работы с несколькими файлами JS
// -------------------------------------------------------------------------------------
// создаем константу для повторяющихся плагинов в разных задачах
const PLUGINS = [
  autoprefixer({
    overrideBrowserslist: ["last 5 versions", ">1%"],
  }),
  mqpacker({ sort: sortCSSmq }), // в конфиг задали чтобы сортировало в мобайл фёрст (min-width) кореектно а для max-width через callback вытягивалось из плагина sortCSSmq
];
// создадим обьект PATH для работы с путями
const PATH = {
  scssFile: "./assets/scss/style.scss",
  scssFiles: "./assets/scss/**/*.scss", // /* означает любой файл а /** означает любой подфайл
  scssFolder: "./assets/scss",
  cssFolder: "./assets/css",
  cssMinFiles: "./assets/css/**/*.min.css",
  htmlFiles: "*.html",
  jsFiles: [
    "./assets/js/**/*.js", // указываем что должно входить в эти файлы
    "!./assets/js/**/*.min.js", // указываем что не должно входить в файлы (это уберет постоянный плагиат новых файлов)
  ],
  jsMinFiles: "./assets/js/**/*.min.js",
  jsFolder: "./assets/js",
  jsBundleName: "bundle.js",
  minFilesFolder: "minFiles",
};

function scss() {
  // у gulp есть метод src (source) который в качестве источника может принимать некий файл или папку
  return (
    src(PATH.scssFile)
      // для работы с асинхронным кодом есть метод .pipe() (он очень похож на then). В данном методе мы можем указывать что нужно сделать с тоем что получили через src
      // перед выгрузкой файла через dest нужно сначала сделать кампиляцию , делаем через .pipe() (для кампиляции нам надо подключить плагин - gulp-sass)
      .pipe(sass().on("error", sass.logError)) // вызываем плагин sass и ставим обработчик в случае каких либо ошибок в коде
      .pipe(postcss(PLUGINS)) // вызываем плагин котором в конфигах сделаем настройки через overrideBrowserslist:['']
      .pipe(csscomb()) //причешим код
      .pipe(dest(PATH.cssFolder)) // говорим что надо обратится к библиотеке gulp и через метод dest() выгрузить чтото кудато. dest() - это метод для выгрузки
      .pipe(browserSync.stream())
  ); // нужно чтобы происходило автоматическое обновление страницы браузера
}
// сделаем функцию которая будет нам подсказывать в devTools где именно расположен тот или иной код в наших файлах
function scssDev() {
  // чтобы видеть где находятся исходники, надо в src вторым параметром задать {sourcemaps: true} в dest надо сделать тоже самое
  return src(PATH.scssFile, { sourcemaps: true })
    .pipe(sass().on("error", sass.logError))
    .pipe(dest(PATH.cssFolder, { sourcemaps: true }))
    .pipe(browserSync.stream());
}
// делаем функцию для создания минифицированых файлов
function scssMin() {
  // создадим локальную константу в которую присвоим плагины (так как у нас в файле scss автопрефиксер уже используется через PLUGINS то нам надо через метод concat() просто приклеть плагин cssnano)
  const pluginsextended = PLUGINS.concat([cssnamo({ preset: "default" })]); // для cssnano можно задавать конфиги(опшинсы) у которых есть свойство preset (поставим дефолтное значение по умолчанию но если надо чтото свое то можно ставить его вместо дефолтного)
  // пример декомпозиции константы pluginsextended черз ES6(рест-сприд опер и мерж)
  // const pluginsextended = [...PLUGINS,cssnamo({preset:'default'})] (через ... разобрали массив на элементы и потом через ,(мерж) присоединили другой плагин и в конце опять собрали в массив )
  return (
    src(PATH.scssFile)
      // все как и у функции scss но есть некоторые добавления
      .pipe(sass().on("error", sass.logError))
      .pipe(csscomb()) // причешим код перед выгрузкой
      // запускаем плагин postcss который получает массив плагинов[] присвоеных константе pluginsextended
      .pipe(postcss(pluginsextended))
      // дальше перед выгрузкой надо сделать чтобы создавался отдельный файл для минифицированого кода а не затирался исходник style.css (используем плагин gulp-rename)
      .pipe(rename({ suffix: ".min" })) // в плагине через конфиг вызываем свойство suffix и задаем через значение что надо добавить к исходному названию
      .pipe(dest(PATH.cssFolder))
  );
}
// создадим задачу которая будет причесывать код между его загрузкой и выгрузкой
function comb() {
  return src(PATH.scssFile) // взяли
    .pipe(csscomb()) // конфиги настроек csscomb можно менять (искать на csscomb/csscomb.js в разделе configure)
    .pipe(dest(PATH.scssFolder));
}
// создадим функцию которая будет поднимать сервер и открывать окно браузера
function syncInit() {
  browserSync.init({
    server: "./",
  });
}
// создадим функцию которая будет отвечать за обновление информации на странице сайта
async function sync() {
  browserSync.reload();
}
// создадим функцию которая будет выполнять задачу сладить за всеми изменениями в коде
function watchFiles() {
  syncInit(); // выполняем функцию syncInit чтобы открылся браузер
  // берем метод watch который должен получить путь ко всем файлам и следидить за ними и как только делаются какието изменения надо запустить функцию scss
  watch(PATH.scssFiles, scss); // следим за всеми изменениями в файле style.scss
  watch(PATH.htmlFiles, sync); // следим за всеми файлами с расширением html
  watch(PATH.jsFiles, sync); // следим за всеми файлами с расширением js в папке js
}

// функции для работы с JS ------------------------------------------
// функция для минификации
function uglifyJS() {
  return src(PATH.jsFiles)
    .pipe(
      terser({
        toplevel: true, // задаем максимальный уровень компресии (сжимания)
        output: { quote_style: 3 }, // задаем в опции (output) что в значении 3 все двойные кавычки будут преобразоаны в одинарные (много других вариантов опций можна почитать в справочниках)
      })
    ) // выполняем создание мини-версии
    .pipe(rename({ suffix: ".min" })) // создаем отдельный файл
    .pipe(dest(PATH.jsFolder));
}
// функция для обьединения в один файл
function concatJS() {
  return src(PATH.jsFiles)
    .pipe(concat(PATH.jsBundleName)) // выполняем плагин concat и берем из файла bundle.js)
    .pipe(dest(PATH.jsFolder));
}
// функция для обьединения в одну папку все мин-версии JS файлов
function buildMinJS() {
  return src(PATH.jsMinFiles).pipe(dest(PATH.minFilesFolder + "/minJS"));
}
// функция для обьединения в одну папку все мин-версии CSS файлов
function buildMinCss() {
  return src(PATH.cssMinFiles).pipe(dest(PATH.minFilesFolder + "/minCSS"));
}
// --------------------------------------------------------------------
// в библиотеке gulp есть много разных методов (после gulp ставим точку и они выскакивают). Для постановки задач нам нужен метод  - task
// в методе task мы указываем команду и какую функцию выполнить ('имя команды', имя функции)
// task('scss',scss); // команда scss запускает задачу scss
// но так как мы уже внесли в методы метод - series то пишем чтобы выполнялось через него
task("scss", series(scss, scssMin));
task("min", scssMin); // команда min запускает задачу scssMin
task("dev", scssDev); // команда dev запустит задачу для devTools
task("comb", comb); // коанда comb запускает задачу причесывания кода
task("watch", watchFiles); // команда watch запускает задачу watchFile

task("uglify", uglifyJS); // команда uglify запустит создание мини-версии
task("concat", concatJS); // команда concat будет обьединять работу нескольких файлов JS

// task('build',parallel(buildMinJS, buildMinCss)); // команда создает копии всех фалов с расширением .min.css и .min.js (через метод parallel мы все задачи запустили одновременно)
task("build", parallel(buildMinJS, buildMinCss));
