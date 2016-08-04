// TODO
// render image pages
// render video pages
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

    return (
      <div className="image page">
        <div className="bgImage" style={divStyle}>
        </div>
        {this.buildTextOverlay(page)}
      </div>
    );
  },

  renderVideoPage: function(page) {
    var media = page['media']['url'];
    console.log(page['render'])

    return (
      <div className="video page bgVideo">
        <div className="video_contain">
          <video id="video-background" preload="true" autoPlay="true" muted="true" loop="true">
            <source src={media} type="video/mp4"/>
          </video>
        </div>
        {this.buildTextOverlay(page)}
      </div>
    );
  },

  buildTextOverlay: function(page) {
    var tweet = this.props.tweets[page['tweet_id']]
    var user_name = tweet['user']['name']
    var screen_name = tweet['user']['screen_name']
    var verified = tweet['user']['verified']

    return (        <div className="textOverlay">
          <div className="textModule">
            <div className="topModule">
              <div className="nameBlock">
                <div className="userName">{user_name}</div>
                <div className="screenName">{screen_name}</div>
              </div>
              <div className="verified {verified}"></div>
            </div>
            <div className="text">{tweet.text}</div>
          </div>
        </div>)
  },

  renderTextPage: function(page) {
    var tweet = this.props.tweets[page['tweet_id']]
    var user_avatar = tweet['user']['profile_image_url']
    var user_name = tweet['user']['name']
    var screen_name = tweet['user']['screen_name']
    var verified = tweet['user']['verified']
    return (
      <div className="text page">
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
    this.serverRequest = $.get(this.props.source, function (result) {
      console.log(result);
      this.setState({
        currentMoment: result,
        currentPage: result['cover_format'],
        isCover: true,
        page: -1
      });
      this.timer = setInterval(this.advancePage, 1000);
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
      <MomentRenderer users={this.state.currentMoment['users']}  tweets={this.state.currentMoment['tweets']} page={this.state.currentPage} isCover={this.state.isCover}/>
    );
  }
});

ReactDOM.render(
  <MomentDriver source="/api/capsule/random" />,
  document.getElementById('content')
);
