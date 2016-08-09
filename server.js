var Twitter = require('twitter');
var mustache = require('mustache');
var _ = require('underscore-node');
var express    = require('express');        // call express
var app        = express();
var secrets = require('./secrets');

var port = process.env.PORT || 8080;        // set our port
var router = express.Router();              // get an instance of the express Router

client = new Twitter(_.extend(secrets, {
  request_options: {
    headers: {
      Accept: '*/*',
      Connection: 'close',
      'X-Twitter-UTCOffset': '+0500',
    }
  }
}));

 var params = {
   include_cards: 1,
   cards_platform: 'iPhone-12',
   max_count: 1000
 };

router.get('/', function(req, res) {
  res.json({ message: 'hooray! welcome to our api!' });
});

router.get('/capsule/random', function(req, res) {
  client.get('moments/guide', params, function(error, guide, response) {
    // console.log(guide['modules'])
    var ids = _.flatten(_.map(guide['modules'], function(module) {
      // console.log(module['moments'])
      return _.map(module['moments'], function(moment) { return moment['moment']['id']; })
    }))
    // console.log(ids)
    var id = _.sample(ids)
    // id = '761195021462806529'

    client.get('moments/capsule/' + id, params, function(error, capsule, response) {
      var pageTweetIds = _.map(capsule['pages'], function(p) { return p['tweet_id']});
      var hydratedTweetIds = Object.keys(capsule['tweets'])
      var needHydrationIds = _.difference(pageTweetIds, hydratedTweetIds)
      if (needHydrationIds.length > 0) {
        var lookupParams = {
          id: needHydrationIds.join(','),
          include_cards: 1,
          cards_platform: 'iPhone-12',
        }
        console.log(lookupParams)

        client.get('statuses/lookup', lookupParams, function(error, tweets, response) {
          _.each(tweets, function(tweet) {
            capsule['tweets'][tweet['id_str']] = tweet;
          });
          res.json(capsule)
        })
      } else {
        res.json(capsule)
      }
    });
  });
});

router.get('/capsule/:id', function(req, res) {
  client.get('moments/capsule/' + req.params.id, params, function(error, capsule, response) {
    res.json(capsule)
  });
});

router.get('/guide', function(req, res) {
  client.get('moments/guide', params, function(error, guide, response) {
    res.json(guide)
  })
})

app.use('/api', router);
app.use(express.static('public'));

app.listen(port);
console.log('Magic happens on port ' + port);
