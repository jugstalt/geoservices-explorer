GeoServicesExplorer.service = function(name, url, type, token) {
    var _name = name;
    var _type = type;
    var _url = url;
    var _token = token;

    var _map = GeoServicesExplorer.app.map;
    var _dynamicLayer = null, _featureLayer = null;
    var _allLayers = [];

    if(type.toLowerCase() === "mapserver") {
        $.getJSON(`${ _url }/layers?f=json${ _token ? '&token='+_token : '' }`, function(allLayers) {

            _allLayers = allLayers;

            var visLayers = [];
            $.each(_allLayers.layers, function(i, layer) {
                if(layer.defaultVisibility === true) {
                    visLayers.push(layer.id);
                }
            });
            _dynamicLayer=L.esri.dynamicMapLayer({
                url: _url,
                opacity: 1.0,
                layers: visLayers
            }).addTo(_map);
        });
    }
    else if(type.toLowerCase() === "featureserver") {
        _featureLayer = L.esri.featureLayer({
            url: _url,
            style: function () {
              return { color: "#70ca49", weight: 2 };
            }
          }).addTo(_map);
    }
    
    this.getName = function() { return _name; };
    this.getUrl = function() { return _url; };
    this.getType = function() { return _type; };
    this.getLayers = function() { 
        return _allLayers && _allLayers.layers ?
                             _allLayers.layers : []; 
    };
    this.getVisibleLayerIds = function() {
        return _dynamicLayer && _dynamicLayer.getLayers() ?
                                _dynamicLayer.getLayers() : [];
    }
    this.setVisibleLayerIds = function(layerIds) {
        if(_dynamicLayer) {
            _dynamicLayer.setLayers(layerIds);
        }
    }
};