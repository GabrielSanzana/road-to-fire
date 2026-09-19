// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      // Angular 13 y posteriores instrumentan el codigo con karma-coverage, no con
      // karma-coverage-istanbul-reporter. Sin este plugin registrado, la orden
      // `ng test --code-coverage` falla al arrancar con
      // "Can not load reporter coverage, it is not registered".
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        random: false
      },	
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    // La ruta y el formato deben coincidir con sonar.javascript.lcov.reportPaths
    // declarado en sonar-project.properties.
    coverageReporter: {
      dir: require('path').join(__dirname, '../coverage'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'lcovonly' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false
  });
};