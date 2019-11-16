var GeoServicesExplorer={};

GeoServicesExplorer.app = new function(){

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
                            var service = new GeoServicesExplorer.service(service.name, service.url, service.type, '');

                            GeoServicesExplorer.app.services.push(service);
                            var $toolServices = $('.tool.services');
                            $toolServices.find('.count')
                                         .css('display','block')
                                         .text(GeoServicesExplorer.app.services.length);

                            $toolServices.trigger('click');
                            //GeoServicesExplorer.ui.closeSidebarPanel('geoservices-explorer-servers-panel');
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

    this.map=null;
    this.init=function(id) {
        GeoServicesExplorer.ui.init($(`#${id}`));
        
        var $toolbar=GeoServicesExplorer.ui._toolbar;

        $("<div><div>Add Server</div></div>")
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

        this.map = L.map('geoservices-explorer-map').setView([0, 0], 1);
        L.esri.basemapLayer("Gray").addTo(this.map);    
    };

    this.servers=[];
    this.services=[];
}();