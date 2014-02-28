
// This cloud code snippet allows a mobile developer to build a custom UI without
// having to familiarize themselves with parse (or integrate all the cruft that comes with it)

// Feel free to use or adapt this code to your own use, but use at your own risk. Pull requests welcome


var express = require('express');
var app = express();
var crypto = require('crypto');
var fs = require('fs');
var S = require('cloud/string.js');

// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body

// Register GET
// Returns error

app.get('/1/register', function(req, res) {
    var output = {meta: {
        code: 400,
        msg: 'Please do a HTTP post'
    }, result: undefined};

    res.send(JSON.stringify(output), output.meta.code);
});

// Register POST
// Currently set up to set up users email and device type and id
// Returns either success or failure (also HTTP statuses), along with a login token to be stored (and used by other endpoints)
app.post('/1/register', function(req, res) {
    var output = {meta: {
        code: 400,
        msg: 'Invalid parameters'
    }, result: undefined};
    try {
        if (req.body.email != undefined && req.body.devicetype != undefined && req.body.deviceid != undefined) {
            var emailPattern = new RegExp('^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$');
            if (req.body.email.match(emailPattern) != undefined) {
                var md5sum = crypto.createHash('md5');
                // Genderate timestemp in case we want to store it
                var ts = Math.round(new Date() / 1000);

                // Make a token out of what is provided (I think the device ID gives enough random ness)
                var s = 'SOMEUSERUSER||' + req.body.email + '||' + S(req.body.fullname).escapeHTML().s + '||' + S(req.body.devicetype).escapeHTML().s + '||' + S(req.body.deviceid).escapeHTML().s;
                var md5hash = crypto.createHash('md5').update(s).digest('hex');

                // Store in database
                // https://www.parse.com/docs/js_guide#users
                username = 'landcruiseruser' + ts.toString();
                var user = new Parse.User();
                user.set('username', username);
                user.set('password', md5hash)
                user.set('email', req.body.email);
                user.set("deviceid", S(req.body.deviceid).escapeHTML().s);
                user.set("devicetype", S(req.body.devicetype).escapeHTML().s);
                user.set("usertoken", md5hash);

                user.signUp(null, {
                  success: function(user) {
                    // Output to user
                    output.meta.code = 200;
                    output.meta.msg = 'OK';                    
                    output.result = {created: true, token: md5hash, username: username};
                    res.send(JSON.stringify(output), output.meta.code);            
                  },
                  error: function(user, error) {
                    // Show the error message somewhere and let the user try again.
                    if (error.code == 202 || error.code == 203) {
                        // Username already taken to email address
                        output.meta.msg = error.message.replace('email address', 'username')
                    }
                    output.meta.debugerr = error
                    output.result = {created: false};
                    res.send(JSON.stringify(output), output.meta.code);
                  }
                });
            } else {
                output.meta.msg = 'Invalid email address'
                res.send(JSON.stringify(output), output.meta.code);
            }
        } else {
            res.send(JSON.stringify(output), output.meta.code);
        }
    } catch (err) {
        res.send(JSON.stringify({meta:{code: 500, msg: "Internal Server Error (" + err.message + ")"}}), 500)
    }
});


// Submit Score GET endpoint
// returns error
app.get('/1/score', function(req, res) {
    var output = {meta: {
        code: 400,
        msg: 'Please do a HTTP POST'
    }, result: undefined};

    res.send(JSON.stringify(output), output.meta.code);
});

// Submit score POST endpoint
// returns whether its successful or not. (uses HTTP status codes)
// Demonstrates how to  submit scores with POST
app.post('/1/score', function(req, res) {
    var output = {meta: {
        code: 400,
        msg: 'Invalid parameters'
    }, result: undefined};

    try {
        if (req.body.token != undefined && (req.body.score != undefined && !isNaN(parseFloat(req.body.score)) && isFinite(req.body.score))) {
            var query = new Parse.Query(Parse.User);
            query.equalTo("usertoken", req.body.token);
            query.find({
            success: function(result) {
                output.meta.code = 200;
                output.meta.msg = 'OK';
                if (result.length == 1) {
                    var objectId = JSON.parse(JSON.stringify(result[0])).objectId;
                    var username = JSON.parse(JSON.stringify(result[0])).username;
                    var existingScore = JSON.parse(JSON.stringify(result[0])).score;
                    Parse.User.logIn(username, req.body.token, {
                        success: function(user) {
                            if (existingScore != undefined) {
                                // score exists
                                if (parseInt(req.body.score) <= existingScore) {
                                    output.meta.code = 400;
                                    output.meta.msg = 'You can not submit a score that is less than or equal to what it currently is';
                                    output.result = {submitted: false, existing: existingScore, yoursubmission: req.body.score}

                                    res.send(JSON.stringify(output), output.meta.code);                                
                                } else {
                                    // Update the score
                                    user.id = objectId;
                                    user.set('score', parseInt(req.body.score));
                                    user.save(null, {
                                        success: function(updateScore) {
                                            output.result = {submitted: true}
                                            res.send(JSON.stringify(output), output.meta.code);
                                        }, 
                                        error: function(updateScore, error) {
                                            output.meta.code = 400;
                                            output.meta.msg = 'Internal error (' + error.message + ')';                        
                                            output.result = {submitted: false}
                                            res.send(JSON.stringify(output), output.meta.code);
                                        }
                                    });
                                }
                            } else {
                                // Just update the score
                                user.id = objectId;
                                user.set('score', parseInt(req.body.score));
                                user.save(null, {
                                    success: function(updateScore) {
                                        output.result = {submitted: true}
                                        res.send(JSON.stringify(output), output.meta.code);
                                    }, 
                                    error: function(updateScore, error) {
                                        output.meta.code = 400;
                                        output.meta.msg = 'Internal error (' + error.message + ')';                        
                                        output.result = {submitted: false}
                                        res.send(JSON.stringify(output), output.meta.code);
                                    }
                                });

                            }
                        },
                        error: function(user, error) {
                            output.meta.code = 401;
                            output.meta.msg = 'Token error (' + error.message + ')';                        
                            output.result = {submitted: false}
                            res.send(JSON.stringify(output), output.meta.code);                        
                        }
                    });
                } else {
                    output.meta.code = 401
                    output.meta.msg = 'Invalid user token'
                    res.send(JSON.stringify(output), output.meta.code); 
                }
            },
            error: function(result, error) {
                output.meta.msg = error.message;
                res.send(JSON.stringify(output), output.meta.code);               
            }
            });
        } else {
            res.send(JSON.stringify(output), output.meta.code);
        }
    } catch(err) {
        output.meta.code = 500;
        output.meta.msg = 'Internal server error (' + err.message + ')'
        res.send(JSON.stringify(output), output.meta.code);
    }
});

// High Scores endpoint
// Show top 10 scores, and the user if they are the 11th spot

app.get('/1/scores', function(req, res) {
    var output = {meta: {
        code: 401,
        msg: 'You are no longer signed in'
    }, result: undefined};
    try {
        if (req.query.token != undefined) {
            var query = new Parse.Query(Parse.User);
            query.equalTo("usertoken", req.query.token);
            query.find({
            success: function(result) {
                if (result.length == 1) {
                    var objectId = JSON.parse(JSON.stringify(result[0])).objectId;

                    var newquery = new Parse.Query(Parse.User);
                    newquery.descending("score");
                    newquery.limit(11);
                    newquery.find({
                        success: function(highscores) {
                            output.meta.code = 200;
                            output.meta.msg = 'OK';
                            var hs = JSON.parse(JSON.stringify(highscores));
                            if (hs.length < 10) {
                                // If less than 10 then theres not enough scores for a leaderboard
                                output.result = {listing: false, scores: []}
                            } else {
                                // Otherwise show leaderboard
                                var sanitized_scores = [];                                                       
                                for (var x in hs) {
                                    console.log(x);
                                    if (x < 10) {
                                        // Show only top 10
                                        sanitized_scores.push({name: hs[x].fullName, score: hs[x].score})
                                    }
                                }
                                if (objectId == hs[10].objectId) {
                                    // If the current user matches the 4th score then show it in the list
                                    if (hs[10].score != undefined) {
                                        sanitized_scores.push({name: hs[10].fullName, score: hs[10].score});
                                    };
                                }                                 
                                output.result = {listing: true, scores: sanitized_scores}
                            }
                            res.send(JSON.stringify(output), output.meta.code);
                        },
                        error: function(highscores, error) {
                            output.meta.code = 500;
                            output.meta.msg = 'Internal server error';
                            output.result = {listing: false, scores: []};
                            res.send(JSON.stringify(output), output.meta.code);
                        }
                    });
                } else {
                    output.meta.code = 401
                    output.meta.msg = 'Invalid user token'
                    res.send(JSON.stringify(output), output.meta.code); 
                }
            },
            error: function(result, error) {
                output.meta.msg = error.message;
                res.send(JSON.stringify(output), output.meta.code);               
            }
            });
        } else {
            res.send(JSON.stringify(output), output.meta.code);
        }
    } catch(err) {
        output.meta.code = 500;
        output.meta.msg = 'Internal server error (' + err.message + ')'
        res.send(JSON.stringify(output), output.meta.code);        
    }
});
app.post('/1/scores', function(req, res) {
    var output = {meta: {
        code: 400,
        msg: 'Please do a HTTP GET'
    }, result: undefined};

    res.send(JSON.stringify(output), output.meta.code);
});


// Attach the Express app to Cloud Code.
app.listen();
