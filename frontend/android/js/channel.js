function Channel(init_obj, element_id) {
  this.center = 1;
  this.open = false;
  this.element_id = element_id;
  this.init(init_obj, element_id);
  this.selected = false;
}

Channel.prototype.getNowNext = function () {
  var self = this;
  if (self.contentGuideURI) {
    $.get(
      self.contentGuideURI + '?sid=' + self.getServiceRef() + '&now_next=true',
      function (data) {
        //TODO use ContentGuideServiceRef from the service
        // debugger;
        var now_next = {};
        var boxes = [];
        var newPrograms = self.parseSchedule(data);
        if (newPrograms.length > 0) {
          now_next['now'] = newPrograms[0];
        }
        if (newPrograms.length > 1) {
          now_next['next'] = newPrograms[1];
        }
        self.now_next = now_next;
        if (self.selected) {
          self.updateChannelInfo();
        }
      },
      'text'
    );
  }
};

Channel.prototype.getSchedule = function (callback) {
  var self = this;
  self.programs = [];

  console.log('hello', self.contentGuideURI);
  if (self.contentGuideURI) {
    $.get(
      self.contentGuideURI +
        '?sids[]=' +
        self.getServiceRef() +
        '&start=' +
        self.epg.start +
        '&end=' +
        self.epg.end,
      function (data) {
        //TODO use ContentGuideServiceRef from the service
        self.programs = self.parseSchedule(data);
        if (typeof callback == 'function') {
          callback.call();
        }
      },
      'text'
    );
  }
};

Channel.prototype.init = function (init_obj, channel_index) {
  var self = this;
  this.id = init_obj.channel;
  this.dashUrl = init_obj.contentUrl;
  this.lcn = init_obj.channel;
  this.image = init_obj.imgUri;
  this.title = init_obj.serviceName;
  this.sourceType = init_obj.contentType;
  this.description = init_obj.serviceDescription;
  this.providerName = init_obj.providerName;

  //   self.contentGuideURI = "~~~~~~~"
  self.getNowNext();
  self.getSchedule();
  self.element = document.getElementById('channel_' + channel_index);
  if (self.element == null) {
    var newTextbox = document.createElement('a');
    newTextbox.href = "javascript:channelSelected('" + self.id + "')";
    newTextbox.classList.add('d-flex');
    var span = document.createElement('span');
    span.classList.add('chicon', 'pl-1', 'order-3');
    var img = document.createElement('img');
    img.setAttribute('src', self.image || './images/empty.png');
    span.appendChild(img);
    newTextbox.appendChild(span);
    var span = document.createElement('span');
    span.classList.add('chnumber', 'px-1');
    span.appendChild(document.createTextNode(self.lcn));
    newTextbox.appendChild(span);
    span = document.createElement('span');
    span.classList.add('chname', 'text-truncate');
    span.appendChild(document.createTextNode(self.title));
    newTextbox.appendChild(span);
    var li = document.createElement('li');
    li.classList.add('list-group-item');
    li.id = 'channel_' + channel_index;
    var container = document.createElement('div');
    container.classList.add('d-flex', 'justify-content-end');
    container.appendChild(newTextbox);
    li.appendChild(container);
    self.element = li;
  }
};

Channel.prototype.unselected = function () {
  var self = this;
  self.selected = false;
  self.element.classList.remove('active');
};

Channel.prototype.channelSelected = function () {
  var self = this;
  self.element.classList.add('active');

  self.selected = true;

  self.updateChannelInfo();
};

Channel.prototype.updateChannelInfo = function () {
  console.log('updateChannelInfo');
  var self = this;
  var channelInfo = document.getElementById('channel_info');
  var info = '';
  info =
    '<span class="menuitem_chicon d-block"><img src="' +
    (self.image || './images/empty.png') +
    '"></span>';
  info +=
    '<span class="menuitem_chnumber d-inline-block">' +
    self.lcn +
    '.</span><span class="menuitem_chname d-inline-block">' +
    self.title +
    '</span>';
  if (self.now_next) {
    curTime = new Date();
    var now = self.now_next['now'];
    if (now) {
      if (curTime >= now.end) {
        //Current program ended,update now/next information before updating info
        self.getNowNext();
        return;
      }
      info += '<span class="menuitem_now">Now: ' + now.title + ' ';
      info +=
        Math.max(0, Math.round((now.end.getTime() - curTime.getTime()) / 1000 / 60)) +
        ' mins remaining</span>';
    }
    var next = self.now_next['next'];
    if (next) {
      info += '<span class="menuitem_next">Next: ' + next.title + ' ';
      info += next.start.create24HourTimeString() + ' ';
      info +=
        'Duration ' +
        Math.max(0, Math.round((next.end.getTime() - next.start.getTime()) / 1000 / 60)) +
        ' mins</span>';
    }
  }
  info +=
    '<span class="menuitem_epg btn btn-outline-dark btn-small mt-1 p-1"><a href="javascript:showEpg(\'' +
    self.getServiceRef() +
    '\')" class="text-white">Open EPG</a></span>';
  info +=
    '&nbsp;&nbsp;&nbsp;<span class="menuitem_epg btn btn-outline-dark btn-small mt-1 p-1"><a href="javascript:showStreamInfo()" class="text-white">Info</a></span>';

  //200416 update.
  const channel_banner = document.querySelector(`#channel_banner`);
  channel_banner.style.display = `flex`;
  channel_banner.style.justifyContent = `flex-end`;
  channel_banner.style.alignItems = `center`;
  channel_banner.style.fontSize = `4.5em`;
  let banner = `<span><img src="${self.image || `./image/empty.png`}"</span>`;
  banner += `<span>${self.lcn}.</span>`;
  banner += `<span>${self.title}</span>`;
  //left channel info
  channelInfo.innerHTML = info;
  //channel banner upper-right
  channel_banner.innerHTML = banner;
};

Channel.prototype.showEPG = function () {
  var self = this;
  var programList = null;
  if (self.epg_element == null) {
    var element = document.createElement('div');
    element.addClass('col-4 mx-0 px-0');
    var header = document.createElement('div');
    header.addClass('epg_chinfo align-items-center sticky-top px-2');
    var logo = document.createElement('img');
    logo.setAttribute('src', self.image || './images/empty.png');
    logo.setAttribute('alt', 'channel icon');
    logo.addClass('chicon img-fluid d-block');
    header.appendChild(logo);
    var number = document.createElement('span');
    number.addClass('chnumber d-inline-block float-left');
    number.innerHTML = self.lcn;
    header.appendChild(number);
    var name = document.createElement('span');
    name.addClass('chname text-truncate d-inline-block');
    name.innerHTML = self.title;
    header.appendChild(name);
    element.appendChild(header);
    this.programList = document.createElement('ul');
    this.programList.addClass('list list-group-flush list-programs container-fluid');
    element.appendChild(this.programList);
    self.epg_element = element;
  } else {
    $(this.programList).empty();
  }

  console.log('SHOW', self.programs);

  if (!self.programs) {
    this.getSchedule(self.populateEPG.bind(self));
  } else {
    // this.populateEPG();
    const el = document.createElement('div');
    el.innerHTML = `이 채널의 id는 ${this.id} <br> 이 채널의 타이틀은 ${this.title} <br> 이 서비스의 제공자는 ${this.providerName} <br> 서비스는 ${this.description} 입니다`;
    this.programList.appendChild(el);
  }
  return self.epg_element;
};

Channel.prototype.populateEPG = function (self) {
  if (this.programs)
    for (let i = 0; i < this.programs.length; i++)
      this.programList.appendChild(this.programs[i].populate());
};
