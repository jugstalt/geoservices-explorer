GeoServicesExplorer.server = function(name, url, token) {
    var _name=name;
    var _url=url;
    var _token=token;

    this.getName = function() { return _name; };
    
    this.getUrl = function() { return _url; };
    
    this.isValid=function(callback) {
        $.getJSON(_url+'?f=json', function(result) {
            if(result.currentVersion) {
                callback();
            }
        });
    };

    this.getServices=function(folder, callback) {
        var url=_url +
                (folder ? `/${folder}` : '') + 
                '?f=json' +
                (_token ? `&token=${_token}` : '');
        
        var server = this;
        $.getJSON(url, function(result) {
            var services=[];

            if(result.folders) {
                $.each(result.folders, function(i, folder) {
                    services.push({
                        name:folder,
                        type:'folder'
                    });
                });
            }
            if(result.services) {
                $.each(result.services, function(i, service) {
                    if(typeof service.type === 'string') {
                        service.type = service.type.toLowerCase();
                    }
                    service.url = `${ server.getUrl() }/${ service.name }/${ service.type }`;
                    services.push(service);
                });
            }

            if(callback) {
                callback(services);
            }
        });
    };
};