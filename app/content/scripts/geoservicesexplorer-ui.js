GeoServicesExplorer.ui=new function() {
    // 
    // Sidebar
    //
    this._container=null;
    this._sidebar=null;
    this._toolbar=null;
    this._map=null;

    this.init=function($container){
        $container.addClass('geoservices-explorer-container');
        this._container=$container;
        
        var $sidebar=$("<div>")
            .addClass('geoservices-explorer-sidebar')
            .appendTo($container);
        this._sidebar=$sidebar;

        var $map=$("<div id='geoservices-explorer-map'></div>")
            .addClass('geoservices-explorer-map')
            .appendTo($container);
        this._map=$map;
        
        var $toolbar=$("<div>")
            .addClass('geoservices-explorer-toolbar')    
            .appendTo($container);
        this._toolbar=$toolbar;
    };

    this.sidebarPanel=function(id, title) {
    
        var $panel=$(`#${id}`);
        if($panel.length === 1) {
            this.bringToFront($panel);
            return $panel;
        }

        $panel=$("<div>")
            .attr('id', id)
            .addClass('geoservices-explorer-sidebarpanel')
            .appendTo($(this._sidebar));

        var $title=$("<div>")
            .addClass('geoservices-explorer-sidebarpanel-title')
            .text(title)
            .appendTo($panel);

        $("<div>")
            .addClass('geoservices-explorer-sidebarpanel-close')
            .text("✕")
            .appendTo($title)
            .click(function(){
                var $panel=$(this).closest('.geoservices-explorer-sidebarpanel');
                GeoServicesExplorer.ui.closeSidebarPanel($panel);
            });
        
        $("<div>")
            .addClass('geoservices-explorer-sidebarpanel-content')
            .appendTo($panel);

        this._container.addClass('showsidebar');    

        setTimeout(function(){
            $panel.addClass('show');
        },1);
        

        return $panel;
    };

    this.sidebarPanelContent = function(panel) {
        var $panel = (typeof panel === 'string') ? $(`#${panel}`) : $(panel);
        if($panel.length>0) {
            return $panel.children('.geoservices-explorer-sidebarpanel-content');
        }

        return $(null);
    };

    this.closeSidebarPanel=function(panel) {
        var $panel = (typeof panel === 'string') ? $(`#${panel}`) : $(panel);
        if($panel.length>0) {
            var $sidebar=$panel.parent();

            setTimeout(() => {
                $panel.removeClass('show');

                if($sidebar.children().length <= 1) {
                    GeoServicesExplorer.ui._container.removeClass('showsidebar');
                }
            },1);
            setTimeout(() => {
                $panel.remove();
            }, 300);
        };
    };

    this.bringToFront = function($element) {
        $element.parent().append($element);
    };

    this.form = function($container, form) {
        var $form=$("<div>")
                    .addClass('form')
                    .appendTo($container);

        $.each(form.items, function(i, item) {
             var $formGroup=$("<div>")
                                .addClass('form-group')
                                .appendTo($form);

             if(item.label) {
                $(`<label for='form_item_${item.id}'>${item.label}</label>`)
                    .appendTo($formGroup);
             }
             $(`<input type='text' id='form_item_${item.id}' name='${item.id}' placeholder='${item.placeholder || item.label || ''}' value='${item.value || ''}' />`)
                
                .addClass('form-control')
                .appendTo($formGroup);  
             if(item.description) {
                 $(`<div>${item.description}</div>`)
                    .addClass('form-text text-muted')
                    .css({ fontSize: '.8em' })
                    .appendTo($formGroup);
             } 
        });

        $.each(form.buttons, function(i, button) {
            if(button.onclick) {
                $(`<button>${button.name}</button>`)
                    .addClass('btn btn-primary')
                    .appendTo($form)
                    .data('button', button)
                    .click(function() {
                        var $form=$(this).closest('.form');
                        
                        var result={ };
                        $form.find('input[name]').each(function(i, input) {
                            result[$(input).attr('name')]=$(input).val();  
                        });

                        $(this).data('button').onclick(result);
                    });
            }
        });
    };

    this.clickableList = function($container, items) {
        var $ul=$("<ul>")
            .addClass('geoservices-explorer-list')
            .appendTo($container);

        $.each(items, function(i, item) {
            var $li = $(`<li></li>`)
                .addClass('geoservices-explorer-clickable geoservices-explorer-list-item')
                .addClass(item.class)
                .data('item', item)
                .appendTo($ul)
                .click(function() {
                    var item=$(this).data('item');

                    if(item.onclick) {
                        item.onclick(item);
                    }
                });
            
            $("<div>").text(item.text).appendTo($li);
            if(item.subtext !== null) {
                $("<div>")
                    .addClass('subtext')
                    .text(item.subtext)
                    .appendTo($li);
            }

            if(item.showaddbutton === true) {
                $("<div>")
                    .addClass('addbutton')
                    .appendTo($li);
            }
        });
    };

    this.checkableTree = function($container, nodes) {
        var $rootUl = $("<ul>")
            .addClass('geoservices-explorer-list')
            .appendTo($container);

        var getNode = function(id) {
            for(var n in nodes) {
                if(nodes[n].id === id) {
                    return nodes[n];
                }
            }
            return null;
        };
        var createNodeItem = function(node) {
            var $item = $("<li>")
                .text(node.name)
                .addClass('geoservices-explorer-nodeitem')
                .attr('data-id', node.id);
            
            if(node.checked === true) {
                $item.addClass('checked');
            }
            if(node.onclick) {
                $item.data('node', node).click(function(e) {
                    e.stopPropagation();

                    var node = $(this).data('node');
                    if(node.onclick(node) === true) {
                        $(this).addClass('checked');
                    } else {
                        $(this).removeClass('checked');
                    }
                });
            }

            return $item;
        };
        var getParentList = function(node) {
            if(node === null || node.parentId === null) {
                return $rootUl;
            }

            var parentNode = getNode(node.parentId);
            if(parentNode === null) {
                return $rootUl;
            }
            var $nodeItem = $container.find(`.geoservices-explorer-nodeitem[data-id='${ parentNode.id }']`);
            if($nodeItem.length === 0) {
                var $parentList = getParentList(getNode(parentNode.id));
                if($parentList === null) {
                    return $rootUl;
                }

                $nodeItem = createNodeItem(parentNode).appendTo($parentList);
                $("<ul>").appendTo($nodeItem);
           }

           return $nodeItem.children('ul');
        };

        $.each(nodes, function(i, node) {
            if(node.isParent !== true) {
                var $parentList = getParentList(node);
                var $node = createNodeItem(node).appendTo($parentList);
            }
        });
    };
}();