// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by email.js.
import { name as packageName } from "meteor/philip100:email";

// Write your tests here!
// Here is an example.
Tinytest.add('email - example', function (test) {
  test.equal(packageName, "email");
});
