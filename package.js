Package.describe({
  name: 'philip100:email',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.8.0.2');
  api.use('ecmascript');
  api.mainModule('email.js');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('philip100:email');
  api.mainModule('email-tests.js');
});

Npm.depends({
  nodemailer: '6.1.1',
  url: '0.11.0'
});