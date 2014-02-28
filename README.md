# Parse Cloud Code + Express.js + custom register API #
This cloud code snippet allows a mobile developer to consume a custom API without going through
the parse SDK.

## Why? ##
* The parse SDK can sometimes be a pain in the ass, the javascript SDK has most of the same features anyway.
* Its node.js the new flavor of the month.
* Because its nice to be able to have a template library to refer to when I'm trying to build something. Just clone / fork, and then hack away! (useful for hackathons)

## What ##
* You get a register endpoint which demonstrates registration and receiving of a user token. This puts it all in the parse dashboard
* You can use the user token to do stuff (one get and post example, get high scores, and post score), you get the idea.

## But, This code is crap ##
This is a un-refactored proof of concept. I'm sure theres a lot of things you could do better (awaiting your pull request *hint hint*)

## Can I use this? ##
You are certainly welcome to use this code and adapt it to your own use but do so at your own risk.

## TODO List ##
* Write some tests
* Modulize this a bit more (one module per endpoint)
* API version control
* External API integration (twilio, context.io, etc)
