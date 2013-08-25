var App = App || {};

App.Code = (function (App, $, iScroll, window) {
  "use strict";

  var detailsSource = $("#details-template").html();

  App.Templates = {
    details: Handlebars.compile(detailsSource)
  };

  App.Pages = App.Pages || {};
  App.CurrentListing = 0;
  App.Config = {
    zipCode: "90023",
    useZipCode: false,
    searchRadius: 10
  };

  App.Pages.Kernel = function (event) {
    var that = this,
      eventType = event.type,
      pageName = $(this).attr("data-app-jspage");
    if (App && App.Pages && pageName && App.Pages[pageName] && App.Pages[pageName][eventType]) {
      App.Pages[pageName][eventType].call(that);
    }
  };

  App.Pages.Events = (function () {
    $("div[data-app-jspage]").on(
      'pagebeforecreate pagecreate pagebeforeload pagebeforeshow pageshow pagebeforechange pagechange pagebeforehide pagehide pageinit',
      App.Pages.Kernel
    );
  }());

  App.Dimensions = (function () {
    var width, height, headerHeight, footerHeight, contentHeight,
      isIPhone = (/iphone/gi).test(navigator.appVersion);
    return {
      get: function () {
        width = $(window).width();
        height = $(window).height() + (isIPhone ? 60 : 0);
        headerHeight = $("header", $.mobile.activePage).height() || 0;
        footerHeight = $("footer", $.mobile.activePage).height() || 0;
        contentHeight = height - headerHeight - footerHeight;

        return {
          width: width,
          height: contentHeight
        };
      }
    };
  }());

  App.Pages.homePage = (function () {
    var isShowingListings = false,
      getListings = function (location) {
        App.Coffee.get(location, function () {
          $.mobile.loading("hide");
          App.Coffee.showCurrentListing("locations");
          isShowingListings = true;
          $('#locations').find("ul").css('margin');

          $(".listing").off().on("click", function () {
            App.CurrentListing = this.attributes.getNamedItem("data-rnc-listingid").value;
          });
        });
      },
      showListings = function () {
        $.mobile.loading("show");
        if (App.Location.isEnabled()) {
          $(window).one("rnc_position", function (evt, latitude, longitude, accuracy) {
            getListings({location: latitude + ":" + longitude});
          });
        } else {
          getListings({location: App.Config.zipCode})
        }
      };
    return {
      pageshow: function () {
        var dim = App.Dimensions.get();

        $("#horizontalWrapper").css('height', dim.height);
        $("#verticalWrapper").css('height', dim.height);
        $('#homePanelReset').on('tap', showListings);

        if (!isShowingListings) {
          showListings();
        }
      },
      pagehide: function () {
      }
    };
  }());

  App.Pages.pageScroll = (function () {
    var isShowingListings = false,
      myScroll = null,  //new iScroll('psWrapper'),
      pullDownHeight, $pullDown, $pullDownLabel,

      callRefresh = function () {
        App.Coffee.next(function(){
          var $psScroller = $('#psScroller');

          /* remove the loading spinner */
          $.mobile.loading("hide");
          /* load the new listing */
          App.Coffee.showCurrentListing("psScroller");
          isShowingListings = true;

          /* dynamically adjust the height of the scrollable region */
          $psScroller.find("ul").css('margin', 0);
          var $rows = $psScroller.find("ul > li"), $refresh = $psScroller.find('> div');
          $psScroller.height($rows.eq(0).outerHeight() * $rows.length + $refresh.outerHeight());

          /* set a click event on each row  */
          $(".listing").off().on("click", function () {
            App.CurrentListing = this.attributes.getNamedItem("data-rnc-listingid").value;
          });


          setTimeout(function () {
            myScroll.refresh();
          }, 0)
        });
      },

      getListings = function (location) {
        App.Coffee.get(location, function () {
          var $psScroller = $('#psScroller');

          /* remove the loading spinner */
          $.mobile.loading("hide");
          /* load the new listing */
          App.Coffee.showCurrentListing("psScroller");
          isShowingListings = true;

          /* dynamically adjust the height of the scrollable region */
          $psScroller.find("ul").css('margin', 0);
          var $rows = $psScroller.find("ul > li"), $refresh = $psScroller.find('> div');
          $psScroller.height($rows.eq(0).outerHeight() * $rows.length + $refresh.outerHeight());

          /* set a click event on each row  */
          $(".listing").off().on("click", function () {
            App.CurrentListing = this.attributes.getNamedItem("data-rnc-listingid").value;
          });

          if (!myScroll) {
            $pullDown = $('#pullDown');
            $pullDownLabel = $pullDown.find('.pullDownLabel');
            pullDownHeight = $refresh.outerHeight();

            myScroll = new iScroll('psWrapper', {
                topOffset: pullDownHeight,
                useTransition: true,
                hScrollbar: false,
                vScrollbar: false,
                onRefresh: function () {
                  if ($pullDown.hasClass('loading')) {
                    $pullDown.removeClass();
                    $pullDownLabel.html('Pull down to refresh...');
                  }
                },
                onScrollMove: function () {
                  if (this.y > 5 && !$pullDown.hasClass('flip')) {
                    $pullDown.addClass('flip');
                    $pullDownLabel.html('Release to refresh...');
                    this.minScrollY = 0;
                  } else if (this.y < 5 && $pullDown.hasClass('flip')) {
                    $pullDown.removeClass();
                    $pullDownLabel.html('Pull down to refresh...');
                    this.minScrollY = -pullDownHeight;
                  }
                },
                onScrollEnd: function () {
                  if ($pullDown.hasClass('flip')) {
                    $pullDown.removeClass();
                    $pullDown.addClass('loading');
                    $pullDownLabel.html('Loading...')
                    callRefresh();
                  }
                }
              }
            );
          }

          setTimeout(function () {
            myScroll.refresh();
          }, 0)
        });
      },
      showListings = function () {
        $.mobile.loading("show");
        if (App.Location.isEnabled()) {
          if (App.Location.hasSet()) {
            var loc = App.Location.get();
            getListings({location: loc.latitude + ":" + loc.longitude});
          } else {
            $(window).one("rnc_position", function (evt, latitude, longitude, accuracy) {
              getListings({location: latitude + ":" + longitude});
            });
          }
        } else {
          getListings({location: App.Config.zipCode})
        }
      };
    return {
      pageshow: function () {
        var dim = App.Dimensions.get();
        $("#psWrapper").css('height', dim.height);
        $('#pageScrollPanelReset').on('tap', showListings);

        if (!isShowingListings) {
          showListings();
        }
      },
      pagehide: function () {
      }
    };
  }());

  App.Pages.mapPage = (function () {
    var map, marker, markers = [],
      scale = [
        0, 0, 0, 0, 15, 15, 15, 15, 15, 15,
        15, 14, 14, 14, 14, 14, 14, 14, 13, 13,
        13, 13, 13, 13, 13, 12, 12, 12, 12, 12,
        12, 12, 11, 11, 11, 11, 11, 11, 11, 11,
        10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
      ],
      mapElement = $("#map").get(0),
      getOptions = function (radius) {
        return {
          mapTypeControl: false,
          streetViewControl: false,
          zoom: scale[(radius - 1) % 50],
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
      },
      drawMarkers = function (map, listings) {
        var biz, ndx, len = listings.length;
        for (ndx = 0; ndx < len; ndx += 1) {
          biz = listings[ndx];
          marker = new google.maps.Marker({
            position: new google.maps.LatLng(biz.latitude, biz.longitude),
            map: map,
            bizId: biz.listingId,
            title: biz.businessName
          });
          markers.push(marker);
          google.maps.event.addListener(marker, 'click', function (evt) {
            App.CurrentListing = this.bizId;
            $.mobile.changePage("#detailsPage", {transition: "slide"});
          });
        }
      },
      eraseMarkers = function (map) {
        while (markers && markers.length) {
          marker = markers.pop();
          marker.setMap(null);
          console.log("marker = " + marker.title + ", " + marker.bizId);
        }
      },
      updateMap = function (map) {
        var listings = App.Coffee.getBusinesses();
        if (listings) {
          drawMarkers(map, listings);
        }
      },
      showMap = function (loc) {
        var options = getOptions(App.Config.searchRadius);
        options.center = new google.maps.LatLng(loc.latitude, loc.longitude);
        map = new google.maps.Map(mapElement, options);

        $("#mapPageHome").on("tap click", function (evt) {
          var loc = App.Location.get();
          map.setCenter(new google.maps.LatLng(loc.latitude, loc.longitude));
        });
        /* draw markers on the map */
        eraseMarkers(map);
        updateMap(map);
      };
    return {
      pageshow: function () {
        /* set the CSS height dynamically */
        var dim = App.Dimensions.get();
        $("#map").css('height', dim.height);

        if (App.Location.isEnabled()) {
          showMap(App.Location.get());
        } else {
          App.Location.codeAddress(App.Config.zipCode, function (loc) {
            if (loc) {
              console.log("codeAddress returned " + JSON.stringify(loc));
              showMap(loc);
            }
          });
        }
      }
    };
  }());

  App.Pages.settingsPage = (function () {
    return {
      pageshow: function () {
        var $zipCode = $("#zipCode"),
          $useZipCode = $('#useZipCode'),
          $searchRadius = $('#searchRadius'),
          dim = App.Dimensions.get();

        $("#mySettings").css('height', dim.height);

        // set initial values based on preserved ones
        $searchRadius.val(App.Config.searchRadius);
        $zipCode.val(App.Config.zipCode);

        if (!App.Location.isEnabled()) {
          $useZipCode.val("on");
          $useZipCode.slider("refresh").slider("disable");
          $zipCode.textinput("enable");
        } else {
          $useZipCode.val(App.Config.useZipCode);
          $zipCode.textinput($useZipCode.val("on") === "on" ? "enable" : "disable");
        }

        /* listen for changes */
        $useZipCode.on("change", function (evt) {
          $zipCode.textinput(this.value === "on" ? "enable" : "disable");
          App.Config.useZipCode = this.value;
        });
        $zipCode.on('change', function (evt) {
          App.Config.zipCode = this.value;
        });
        $searchRadius.on('change', function (evt) {
          App.Config.searchRadius = this.value;
        });
      }
    };
  }());

  App.Pages.creditsPage = (function () {
    return {
      pageshow: function () {
        /* set the CSS height dynamically */
        var dim = App.Dimensions.get();
        $("#myCredits").css('height', dim.height);
      }
    };
  }());

  App.Pages.detailsPage = (function () {
    var map,
      latLong = new google.maps.LatLng(34.0522, -118.2428),
      mapElement = $("#miniMap").get(0),
      options = {
        mapTypeControl: false,
        streetViewControl: false,
        center: latLong,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      },
      $details = $("#detailsContent");
    return {
      pageshow: function () {
        /* set the CSS height dynamically */
        var info = App.Coffee.getBusiness(App.CurrentListing),
          divHeight, totalHeight, ctr, marker,
          infoWindow = new google.maps.InfoWindow({}),
          dim = App.Dimensions.get();

        $details.html(App.Templates.details(info)).trigger("create");
        divHeight = $details.height();
        totalHeight = dim.height - divHeight - 32;
        $("#miniMap").css('height', totalHeight);
        ctr = new google.maps.LatLng(info.latitude, info.longitude);
        options.center = ctr;
        map = new google.maps.Map(mapElement, options);
        marker = new google.maps.Marker({
          position: ctr,
          map: map
        });
        google.maps.event.addListener(marker, 'click', function () {
          infoWindow.open(map, marker);
        });
      },
      pagehide: function () {
      }
    };
  }());

  App.Pages.verticalPage = (function () {
    var myScroll;
    return {
      pageshow: function () {
        myScroll = new iScroll('verticalWrapper');
      },
      pagehide: function () {
        myScroll.destroy();
        myScroll = null;
      }
    };
  }());

  App.Pages.horizontalPage = (function () {
    var myScroll;
    return {
      pageshow: function () {
        myScroll = new iScroll('horizontalWrapper');
      },
      pagehide: function () {
        myScroll.destroy();
        myScroll = null;
      }
    };
  }());

}(App, jQuery, iScroll, window));
