var GeoServicesExplorer={};

GeoServicesExplorer.app = new function($){

    var makeServerItemsList = function(server, folder) {
        var $panel = GeoServicesExplorer.ui.sidebarPanel('geoservices-explorer-servers-panel', 'Servers');
        var $content = GeoServicesExplorer.ui.sidebarPanelContent($panel).empty(); 

        server.getServices(folder, function(services) {
            var items = $.map(services, function(service) {
                return {
                    text: service.name,
                    subtext: `Type: ${service.type}`,
                    class: service.type,
                    showaddbutton: service.type === 'mapserver',
                    service: service,
                    folder: folder,
                    server: server,
                    onclick: function(item) {
                        var service = item.service;
                        if(service.type.toLowerCase() === "folder") {
                            var folder = item.folder ? `${item.folder}/${service.name}` : service.name;
                            makeServerItemsList(item.server, folder)
                        }
                        if(service.type.toLowerCase() === "mapserver") {
                            addService(service.name, service.url, service.type, '');
                        }
                        if(service.type.toLowerCase() === "featureserver") {
                            $.getJSON($.addUrlparameter(item.service.url, "f", "json"), function(result) {
                                if(result.layers) {
                                    var layers = $.map(result.layers, function(layer) {
                                        return {
                                            text: layer.name,
                                            subtext: layer.id,
                                            class: 'featureserver-layer',
                                            showaddbutton: true,
                                            service: service,
                                            layer: layer,
                                            onclick: function(item) {
                                                addService(service.name + '/' + layer.name, service.url + '/' + layer.id, service.type, '');
                                            }
                                        }
                                    });
                                    var $panel = GeoServicesExplorer.ui.sidebarPanel('geoservices-explorer-servers-panel', 'Servers');
                                    var $content = GeoServicesExplorer.ui.sidebarPanelContent($panel).empty(); 

                                    GeoServicesExplorer.ui.clickableList($content, [
                                        {
                                            text: '..',
                                            class: 'back',
                                            folder: item.folder,
                                            server: item.server,
                                            onclick: function(item) {
                                                makeServerItemsList(item.server, item.folder);
                                            }
                                        }
                                    ]);

                                    GeoServicesExplorer.ui.clickableList($content, layers);
                                }
                            });
                        }
                    }
                };
            });

            if(folder) {
                var parent = folder.indexOf('/')>0 ? folder.substr(0, folder.lastIndexOf('/')) : '';
                GeoServicesExplorer.ui.clickableList($content, [
                    {
                        text: '..',
                        class: 'back',
                        parent: parent,
                        server: server,
                        onclick: function(item) {
                            makeServerItemsList(item.server, item.parent);
                        }
                    }
                ]);
            }
            GeoServicesExplorer.ui.clickableList($content, items);
        });
    };

    var addService = function(name, url, type, token) {
        var service = new GeoServicesExplorer.service(name, url, type, token);

        GeoServicesExplorer.app.services.push(service);
        
        var $toolServices = $('.tool.services');
        
        $toolServices.find('.count')
                     .css('display','block')
                     .text(GeoServicesExplorer.app.services.length);

        $toolServices.trigger('click');
    };

    this.map = null;
    this.init = function(id, initOptions) {
        GeoServicesExplorer.ui.init($(`#${id}`));
        
        var $toolbar=GeoServicesExplorer.ui._toolbar;

        var $toolAddServer = $("<div><div>Add Server</div></div>")
            .addClass('tool addserver')
            .appendTo($toolbar)
            .click(function() {
                var $this=$(this);

                var $panel = GeoServicesExplorer.ui.sidebarPanel('geoservices-explorer-addserver-panel', 'Add Server');
                var $content = GeoServicesExplorer.ui.sidebarPanelContent($panel);

                if($content.children('.form').length==0) {
                    GeoServicesExplorer.ui.form($content,
                    {
                        items:[
                            {
                                id:'name',
                                label:'Servername',
                                value:`Server ${(GeoServicesExplorer.app.servers.length + 1)}`,
                                description: 'An name for the server'
                            },
                            {
                                id:'server',
                                label: 'Geoservices url',
                                description:'Url to services endpoint, e.g. https://myserver.com/arcgis/rest/services, https://myserver.com/geoservices/rest/services'
                            }
                        ],
                        buttons:[
                            {
                                name:'Add Server',
                                onclick:function(result) {
                                    var server = new GeoServicesExplorer.server(result.name, result.server);
                                    server.isValid(function() {
                                        GeoServicesExplorer.app.servers.push(server);

                                        var $toolServers = $this.parent().children('.tool.servers');
                                        
                                        $toolServers.find('.count')
                                            .css('display','block')
                                            .text(GeoServicesExplorer.app.servers.length);

                                        $toolServers.trigger('click');
                                        GeoServicesExplorer.ui.closeSidebarPanel('geoservices-explorer-addserver-panel');
                                    });
                                }
                            }
                        ]
                    });

                    if(initOptions.server) {
                        var $inputName = $content.children('.form').find('input[name="name"]');
                        var $inputServer = $content.children('.form').find('input[name="server"]');
                        var $commitButton=$content.children('.form').find('button.btn-primary');

                        $inputName.val(initOptions.serverName ?? "Server 1");
                        $inputServer.val(initOptions.server);
                        delete initOptions.server;

                        $commitButton.trigger('click');
                    }
                }   
            });

        $("<div><div>Servers</div><div class='count'></div></div>")
            .addClass('tool servers')
            .appendTo($toolbar)
            .click(function(){
                var $panel = GeoServicesExplorer.ui.sidebarPanel('geoservices-explorer-servers-panel', 'Servers');
                var $content = GeoServicesExplorer.ui.sidebarPanelContent($panel).empty();

                var items = $.map(GeoServicesExplorer.app.servers, function(server) {
                    return {
                        text: server.getName(),
                        subtext: server.getUrl(),
                        class: 'server',
                        server: server,
                        onclick: function(item) {
                            makeServerItemsList(item.server, '');
                        }
                    }
                });

                GeoServicesExplorer.ui.clickableList($content, items);
            });

        $("<div><div>Geo-Services</div><div class='count'></div></div>")
            .addClass('tool services')
            .appendTo($toolbar)
            .click(function(){
                var $panel = GeoServicesExplorer.ui.sidebarPanel('geoservices-explorer-services-panel', 'Services');
                var $content = GeoServicesExplorer.ui.sidebarPanelContent($panel).empty();

                var items = $.map(GeoServicesExplorer.app.services, function(service) {
                    return {
                        text: service.getName(),
                        subtext: service.getUrl(),
                        class: service.getType(),
                        service: service,
                        onclick: function(item) {
                            if(item.service.getType() === 'mapserver') {
                                var serviceLayers = item.service.getLayers();
                                var layers = [], visibleLayerIds = item.service.getVisibleLayerIds();
        
                                $.each(serviceLayers, function(i, serviceLayer) {
                                    layers.push({
                                        name: serviceLayer.name,
                                        id: serviceLayer.id,
                                        parentId: serviceLayer.parentLayer ? serviceLayer.parentLayer.id : null,
                                        isParent: serviceLayer.type && serviceLayer.type.toLowerCase() === 'group layer',
                                        checked: $.inArray(serviceLayer.id, visibleLayerIds) >= 0,
                                        service: item.service,
                                        onclick: function(node) {
                                            var layerId = node.id;
                                            var layerIds = node.service.getVisibleLayerIds();

                                            if($.inArray(layerId, layerIds) >= 0) {
                                                var layerIds = $.grep(layerIds, function(value) {
                                                    return value != layerId;
                                                  });
                                                node.service.setVisibleLayerIds(layerIds);

                                                return false;      
                                            } else {
                                                layerIds.push(layerId);
                                                node.service.setVisibleLayerIds(layerIds);

                                                return true;
                                            }
                                        }
                                    })
                                });
        
                                var $panel = GeoServicesExplorer.ui.sidebarPanel('geoservices-explorer-service-panel', item.service.getName());
                                var $content = GeoServicesExplorer.ui.sidebarPanelContent($panel).empty();
                                
                                GeoServicesExplorer.ui.checkableTree($content, layers);
                            }
                        }
                    }
                });

                GeoServicesExplorer.ui.clickableList($content, items);
            });

        this.map = L.map('geoservices-explorer-map',{
            minZoom: 0,
            maxZoom: 21
        }).setView([0, 0], 1);

        L.esri.basemapLayer("Gray").addTo(this.map);

        if(initOptions && initOptions.server) {
            $toolAddServer.trigger('click');
        }
    };

    this.servers=[];
    this.services=[];

    this.refreshMap = function() {
        if(this.map) {
            this.map._onResize(); 
        }
    };

    this.removeService = function(service) {
        console.log('remove service', service);

        var services = [];
        for(var s in GeoServicesExplorer.app.services) {
            if(GeoServicesExplorer.app.services[s] !== service) {
                services.push(GeoServicesExplorer.app.services[s]);
            }
        }

        GeoServicesExplorer.app.services = services;

        if(service.removeService) {
            service.removeService();
        }
        
        var $toolServices = $('.tool.services');
        
        $toolServices.find('.count')
                     .css('display', GeoServicesExplorer.app.services.length > 0 ? 'block' : 'none')
                     .text(GeoServicesExplorer.app.services.length);
    }

    $.extend({
        addUrlparameter: function(url, parameter, value) {
            url += url.indexOf("?")> 0 ? "&" : "?";
            url += parameter + "=" + encodeURIComponent(value);
            return url;
        }
    });
}(jQuery);