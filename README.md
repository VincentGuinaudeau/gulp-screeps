# gulp-screeps

A Gulp plugin for commiting and retreiving code to / from your Screeps account.
The plugin is based on the [grunt equivalent](https://github.com/screeps/grunt-screeps).

## Usage

**gulpfile.js:**
```js
var gulp = require('gulp');
var screeps = require('gulp-screeps');
var options = { /* ... */ }
 
gulp.task('pull', function() {
	return gulp.src('*.js')
		.pipe(screeps(options));
});
gulp.task('pull', function() {
	options.action = "pull";
	return screeps(options)
		.pipe(gulp.dest('.'));
});
```

If you don't want to commit your account information, require an other module and export an option object. Don't forget to add the file to your **.gitignore**.

**gulpfile.js:**
```js
var gulp = require('gulp');
var screeps = require('gulp-screeps');
var credentials = require('./credentials.js');

gulp.task('pull', function() {
	return gulp.src('*.js')
		.pipe(screeps(credentials));
});
gulp.task('pull', function() {
	credentials.action = "pull";
	return screeps(credentials)
		.pipe(gulp.dest('.'));
});
...
```
**credentials.js:**
```js
module.exports = {
    email: 'EMAIL',
    password: 'PASSWORD',
    branch: 'default',
    ptr: false,
    host: 'someprivateserver.com',
    port: 9000,
    secure: false
};
```
### Options
- email - the email of your account
- password - the password of your account
- branch (optional) - the branch you wish to commit the code to (default : "default")
- ptr (optional) - use [Public Test Realm](http://support.screeps.com/hc/en-us/articles/205999532-Public-Test-Realm) (default : false)
- host (optional) - the url of the host (default : "screeps.com")
- port (optional) - the port of the host (default : 443)
- secure (optional) - if the host is using https instead of http (default : port == 443)
- action (optional) - either "pull" or "push" (default : "push")
