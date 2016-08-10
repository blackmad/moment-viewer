// TODO
// render covers
// obey image/video crops
// pivot to another moment

var MomentRenderer = React.createClass({
  renderImagePage: function(page) {
    var imgStyle = {}
    if (page['render'] && 
        page['render']['crops'] && 
        page['render']['crops']['portrait_9_16']) {
      var crop = page['render']['crops']['portrait_9_16']
      imgStyle = {
        clip: 'rect(' + crop['x'] + 'px,' +
          crop['y'] + 'px,' +
          (crop['x'] + crop['w']) + 'px,' +
          (crop['y'] + crop['h']) + 'px' +
        ')'
      }
    }

    var divStyle = {
      backgroundImage: 'url(' + page['media']['url'] + ')',
      height: '100vh',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'cover'
    }
    var isCover = this.props['isCover']

    return (
      <div className="image page">
        <div className="bgImage" style={divStyle}>
        </div>
        {this.buildTextOverlay(page, isCover)}
      </div>
    );
  },

  renderVideoPage: function(page) {
    var media = page['media']['url'];
    var isCover = this.props['isCover']
    console.log(page['render'])

    return (
      <div className="video page bgVideo">
        <div className="video_contain">
          <video id="video-background" preload="true" autoPlay="true" muted="true" loop="true">
            <source src={media} type="video/mp4"/>
          </video>
        </div>
        {this.buildTextOverlay(page, isCover)}
      </div>
    );
  },

  buildCoverPageOverlay: function(page) {
    var description = this.props.moment['description']
    var title = this.props.moment['title']
    var time_string = this.props.moment['time_string']

    var tweet = this.props.tweets[page['tweet_id']]
    var screen_name = tweet['user']['screen_name']

    return (        
      <div className="coverTextOverlay">
        <div className="textModule">
          <div className="timeString">{time_string}</div>
          <div className="title">{title}</div>
          <div className="descriptionBlock">
            <span className="description">{description}</span>
            <span className="nameBlock">
              <span className="mediaBy">Media by</span>
              <span className="screenName">@{screen_name}</span>
            </span>
          </div>
        </div>
      </div>
    )
  },

  buildTextPageOverlay: function(page) {
    var tweet = this.props.tweets[page['tweet_id']]
    var user_name = tweet['user']['name']
    var screen_name = tweet['user']['screen_name']
    var verified = tweet['user']['verified']

    return (        <div className="textOverlay">
          <div className="textModule">
            <div className="topModule">
              <div className="nameBlock">
                <div className="userName">{user_name}</div>
                <div className="screenName">@{screen_name}</div>
              </div>
              <div className="verified {verified}"></div>
            </div>
            <div className="text">{tweet.text}</div>
          </div>
        </div>)
  },

  buildTextOverlay: function(page, isCover) {
    if (isCover) {
      return this.buildCoverPageOverlay(page);
    } else {
      return this.buildTextPageOverlay(page);
    }
  },

  renderTextPage: function(page) {
    var tweet = this.props.tweets[page['tweet_id']]
    var user_avatar = tweet['user']['profile_image_url']
    var user_name = tweet['user']['name']
    var screen_name = tweet['user']['screen_name']
    var verified = tweet['user']['verified']
    return (
      <div className="text page">
        <div className="contentBox">
          <div className="topModule">
            <div className="userAvatar"><img src={user_avatar}/></div>
            <div className="nameBlock">
              <div className="userName">{user_name}</div>
              <div className="screenName">@{screen_name}</div>
            </div>
            <div className="verified {verified}"></div>
          </div>
          <div className="text">{tweet.text}</div>
        </div>
      </div>
    );
  },

  render: function() {
    var page = this.props.page

    if (!page) {
      return (<div>waiting...</div>)
    }

    console.log(page['type'])
    if (page['type'] == 'image') {
      return this.renderImagePage(page);
    } else if (page['type'] == 'video') {
      return this.renderVideoPage(page);
    } else if (page['type'] == 'text') {
      return this.renderTextPage(page);
    } else if (page['type'] == 'animated_gif') {
      return this.renderVideoPage(page);
    } else {
      return this.renderTextPage(page);
    }  // quote tweet?
  }
});

var MomentDriver = React.createClass({
  getInitialState: function() {
    return {
      currentMoment: {
        tweets: [],
        cover_format: {}
      }
    };
  },

  componentDidMount: function() {
    var rpc = '/api/capsule/' + this.props.initialId;
    if (!this.state.isFirstLoad && this.props.shouldAdvance) {
       rpc = '/api/capsule/random'
    }
    this.serverRequest = $.get(rpc, function (result) {
      console.log(result);
      this.setState({
        isFirstLoad: !this.state.isFirstLoad,
        currentMoment: result,
        currentPage: result['cover_format'],
        isCover: true,
        page: -1
      });
      this.timer = setInterval(this.advancePage, this.props.timeout);
    }.bind(this));
  },

  componentWillUnmount: function() {
    this.serverRequest.abort();
  },

  advancePage: function() {
    var page = this.state.page + 1;
    console.log('advancing to page ' + page + ' of '+ this.state.currentMoment['pages'].length);

    if (page >= this.state.currentMoment['pages'].length) {
      console.log('fetching new data')
      window.clearInterval(this.timer)
      this.componentDidMount();
    } else {
      this.setState({
        currentMoment: this.state.currentMoment,
        currentPage: this.state.currentMoment['pages'][page],
        isCover: false,
        page: page
      });
    }
  },

  render: function() {
    return (
      <MomentRenderer moment={this.state.currentMoment['moment']} users={this.state.currentMoment['users']}  tweets={this.state.currentMoment['tweets']} page={this.state.currentPage} isCover={this.state.isCover}/>
    );
  }
});

function parseParams(query) {
  var result = {};
  query.split("&").forEach(function(part) {
    var item = part.split("=");
    result[item[0]] = decodeURIComponent(item[1]);
  });
  return result;
}

var hash = window.location.hash.substring(1);
var params = parseParams(hash)

var id = params['id']
if (!id) {
  id = 'random';
}
var shouldAdvance = params['shouldAdvance'] != 'false' || params['shouldAdvance'] != '0'
var timeout = parseInt(params['timeout'] || '60000')

console.log('id: ' + id)
ReactDOM.render(
  <MomentDriver initialId={id} shouldAdvance={shouldAdvance} timeout={timeout}/>,
  document.getElementById('content')
);
