(function() {
    'use strict';
    var website = openerp.website;
    var QWeb = openerp.qweb;
    var my = openerp.web.search;
    var _t = openerp._t;
    QWeb.add_template('/odoo_flatodoo_backend_theme/static/src/xml/shoppe_qweb.xml');
    openerp.web.ActionManager.include({
        get_title: function() {
            var titles = [];
            for (var i = 0; i < this.breadcrumbs.length; i += 1) {
                var item = this.breadcrumbs[i];
                var tit = item.get_title();
                if (item.hide_breadcrumb) {
                    continue;
                }
                if (!_.isArray(tit)) { tit = [tit]; }
                for (var j = 0; j < tit.length; j += 1) {
                    var label = _.escape(tit[j]);
                    if (i === this.breadcrumbs.length - 1 && j === tit.length - 1) { titles.push(_.str.sprintf('<span class="oe_breadcrumb_item">%s</span>', label)); } else { titles.push(_.str.sprintf('<a href="#" class="oe_breadcrumb_item" data-id="%s">%s</a>', item.id, label)); }
                }
            }
            return titles.join('  <i class="fa fa-angle-right"></i>  ');
        },
    });
    openerp.web.UserMenu.include({
        start: function() {
            var self = this;
            this._super.apply(this, arguments);
            this.$el.parent().on('click', '.dropdown-menu li a[data-menu], a[data-menu]', function(ev) {
                ev.preventDefault();
                var f = self['on_menu_' + $(this).data('menu')];
                if (f) { f($(this)); }
            });
            this.$el.parent().show();
        },
        do_update: function() {
            var self = this;
            var fct = function() {
                var $avatar = self.$el.find('.oe_topbar_avatar');
                $avatar.attr('src', $avatar.data('default-src'));
                var $lang_icon = self.$el.find('a[data-menu="settings"] img');
                if (!self.session.uid)
                    return;
                var func = new openerp.web.Model("res.users").get_func("read");
                return self.alive(func(self.session.uid, ["name", "company_id", "lang"])).then(function(res) {
                    var topbar_name = res.name;
                    var user_lang = res.lang;
                    if (openerp.session.debug)
                        topbar_name = _.str.sprintf("%s (%s)", topbar_name, openerp.session.db);
                    if (res.company_id[0] > 1)
                        topbar_name = _.str.sprintf("%s (%s)", topbar_name, res.company_id[1]);
                    self.$el.find('.oe_topbar_name').text(topbar_name);
                    if (!openerp.session.debug) { topbar_name = _.str.sprintf("%s (%s)", topbar_name, openerp.session.db); }
                    var avatar_src = self.session.url('/web/binary/image', { model: 'res.users', field: 'image_small', id: self.session.uid });
                    $avatar.attr('src', avatar_src);
                    $lang_icon.attr('src', '/odoo_flatodoo_backend_theme/static/src/img/flag/' + user_lang + '.png');
                    openerp.web.bus.trigger('resize');
                });
            };
            this.update_promise = this.update_promise.then(fct, fct);
        },
    });
    openerp.web.FormView.include({
        do_update_pager: function(hide_index) {
            this.$pager.toggle(this.dataset.ids.length > 1);
            if (hide_index) { $(".oe_form_pager_state", this.$pager).html(""); } else { $(".oe_form_pager_state", this.$pager).html(_.str.sprintf(_t("%d of %d"), this.dataset.index + 1, this.dataset.ids.length)); }
        },
        load_form: function(data) {
            var self = this;
            if (!data) {
                throw new Error(_t("No data provided."));
            }
            if (this.arch) {
                throw "Form view does not support multiple calls to load_form";
            }
            this.fields_order = [];
            this.fields_view = data;
            this.rendering_engine.set_fields_registry(this.fields_registry);
            this.rendering_engine.set_tags_registry(this.tags_registry);
            this.rendering_engine.set_widgets_registry(this.widgets_registry);
            this.rendering_engine.set_fields_view(data);
            var $dest = this.$el.hasClass("oe_form_container") ? this.$el : this.$el.find('.oe_form_container');
            this.rendering_engine.render_to($dest);
            this.$el.on('mousedown.formBlur', function() { self.__clicked_inside = true; });
            this.$buttons = $(QWeb.render("FormView.buttons", { 'widget': self }));
            if (this.options.$buttons) { this.$buttons.appendTo(this.options.$buttons); } else { this.$el.find('.oe_form_buttons').replaceWith(this.$buttons); }
            this.$buttons.on('click', '.oe_form_button_create', this.guard_active(this.on_button_create));
            this.$buttons.on('click', '.oe_form_button_edit', this.guard_active(this.on_button_edit));
            this.$buttons.on('click', '.oe_form_button_delete', this.guard_active(this.on_button_delete));
            this.$buttons.on('click', '.oe_form_button_save', this.guard_active(this.on_button_save));
            this.$buttons.on('click', '.oe_form_button_cancel', this.guard_active(this.on_button_cancel));
            if (this.options.footer_to_buttons) { this.$el.find('footer').appendTo(this.$buttons); }
            this.$sidebar = this.options.$sidebar || this.$el.find('.oe_form_sidebar');
            if (!this.sidebar && this.options.$sidebar) {
                this.sidebar = new openerp.web.Sidebar(this);
                this.sidebar.appendTo(this.$sidebar);
                if (this.fields_view.toolbar) { this.sidebar.add_toolbar(this.fields_view.toolbar); }
                this.sidebar.add_items('other', _.compact([self.is_action_enabled('create') && { label: _t('Duplicate'), callback: self.on_button_duplicate }]));
            }
            this.has_been_loaded.resolve();
            this.$el.find(".oe_form_group_row,.oe_form_field,label,h1,.oe_title,.oe_notebook_page, .oe_list_content").on('click', function(e) {
                if (self.get("actual_mode") == "view") {
                    var $button = self.options.$buttons.find(".oe_form_button_edit");
                    $button.openerpBounce();
                    e.stopPropagation();
                    openerp.web.bus.trigger('click', e);
                }
            });
            this.$el.find(".oe_form_field_status:not(.oe_form_status_clickable)").on('click', function(e) {
                if ((self.get("actual_mode") == "view")) {
                    var $button = self.$el.find(".oe_highlight:not(.oe_form_invisible)").css({ 'float': 'left', 'clear': 'none' });
                    $button.openerpBounce();
                    e.stopPropagation();
                }
            });
            this.trigger('form_view_loaded', data);
            return $.when();
        },
    });
    openerp.web.SearchView.include({
        renderFacets: function(collection, model, options) {
            var self = this;
            var started = [];
            var $e = this.$('div.oe_searchview_facets');
            _.invoke(this.input_subviews, 'destroy');
            this.input_subviews = [];
            var i = new my.InputView(this);
            started.push(i.appendTo($e));
            this.input_subviews.push(i);
            this.query.each(function(facet) {
                var f = new my.FacetView(this, facet);
                started.push(f.appendTo($e));
                self.input_subviews.push(f);
                var i = new my.InputView(this);
                started.push(i.appendTo($e));
                self.input_subviews.push(i);
            }, this);
            _.each(this.input_subviews, function(childView) {
                childView.on('focused', self, self.proxy('childFocused'));
                childView.on('blurred', self, self.proxy('childBlurred'));
            });
        },
    });
    openerp.web.search.Filters.include({
        start: function() {
            var self = this;
            var is_group = function(i) {
                return i instanceof openerp.web.search.FilterGroup;
            };
            var visible_filters = _(this.drawer.controls).chain().reject(function(group) {
                return _(_(group.children).filter(is_group)).isEmpty() || group.modifiers.invisible;
            });
            var groups = visible_filters.map(function(group) {
                var filters = _(group.children).filter(is_group);
                return {
                    name: _.str.sprintf("<span class='oe_i'>%s</span> %s", group.icon, group.name),
                    filters: filters,
                    length: _(filters).chain().map(function(i) {
                        return i.filters.length;
                    }).sum().value()
                };
            }).value();
            var $div = $('<div class="src_filter">').appendTo(this.$el);
            var rendered_lines = _.map(groups, function(group) {
                var $dl = $('<dl class="dl-horizontal">').appendTo($div);
                $('<dt>').html(group.name).appendTo($dl);
                var $dd = $('<dd>').appendTo($dl);
                return $.when.apply(null, _(group.filters).invoke('appendTo', $dd));
            });
            return $.when.apply(this, rendered_lines);
        },
    });
    openerp.web.WebClient.include({
        show_application: function() {
            var self = this;
            this._super();
            self.toggle_bars(true);
            self.user_left_menu = new openerp.web.UserLeftMenu(self);
            self.user_left_menu.prependTo(this.$el.parents().find('.oe_user_left_menu'));
            self.user_left_menu.on('user_logout', self, self.on_logout);
            self.user_left_menu.do_update();
        },
        check_timezone: function() {
            var self = this;
            return self.alive(new openerp.web.Model('res.users').call('read', [
                [this.session.uid],
                ['tz_offset']
            ])).then(function(result) {
                var user_offset = result[0]['tz_offset'];
                var offset = -(new Date().getTimezoneOffset());
                var browser_offset = (offset < 0) ? "-" : "+";
                browser_offset += _.str.sprintf("%02d", Math.abs(offset / 60));
                browser_offset += _.str.sprintf("%02d", Math.abs(offset % 60));
                if (browser_offset !== user_offset) {
                    var $icon = $(QWeb.render('WebClient.odooshoppe_timezone_systray'));
                    $icon.on('click', function() {
                        var notification = self.do_warn(_t("Timezone Mismatch"), QWeb.render('WebClient.timezone_notification', { user_timezone: openerp.session.user_context.tz || 'UTC', user_offset: user_offset, browser_offset: browser_offset, }), true);
                        notification.element.find('.oe_webclient_timezone_notification').on('click', function() { notification.close(); }).find('a').on('click', function() {
                            notification.close();
                            self.user_menu.on_menu_settings();
                            return false;
                        });
                    });
                    $icon.appendTo(window.$('.oe_systray'));
                }
            });
        }
    });
    openerp.web.Client.include({
        show_annoucement_bar: function() {
            return;
        },
        bind_events: function() {
            var self = this;
            this._super();
            var root = self.$el;
            var elem_sm = $("<a id='leftbar_toggle'><i class='fa fa-bars'></i></a>");
            elem_sm.appendTo(root.find('.menu-toogle'));
            self.$el.on('click', '#leftbar_toggle', function() {
                var leftbar = root.find('.oe_leftbar > div');
                if (leftbar.hasClass('fix_icon_width')) {
                    leftbar.removeClass('fix_icon_width');
                    leftbar.parent().removeClass('fix_icon_width');
                    leftbar.find('.menu_title').show();
                    leftbar.find('.oe_footer').show();
                } else {
                    $('h3.menu_heading').removeClass('fix_active');
                    $('h3.menu_heading').parent().find('div.oe_secondary_menu').stop().slideUp(500);
                    leftbar.find('.menu_title').hide();
                    leftbar.find('.oe_footer').hide();
                    leftbar.addClass('fix_icon_width');
                    leftbar.parent().addClass('fix_icon_width');
                }
            });
        }
    });
    openerp.web.UserLeftMenu = openerp.web.Widget.extend({
        template: "UserLeftMenu",
        init: function(parent) {
            this._super(parent);
            this.update_promise = $.Deferred().resolve();
        },
        start: function() {
            var self = this;
            this._super.apply(this, arguments);
            this.$el.parent().on('click', 'a[data-menu]', function(ev) {
                ev.preventDefault();
                var f = self['on_menu_' + $(this).data('menu')];
                if (f) { f($(this)); }
            });
            this.$el.parent().show();
        },
        do_update: function() {
            var self = this;
            var Users = new openerp.web.Model('res.users');
            Users.call('has_group', ['base.group_user']).done(function(is_employee) {
                if (is_employee) {
                    self.update_promise.then(function() {
                        var im = new openerp.im_chat.InstantMessaging(self);
                        openerp.im_chat.single = im;
                        im.appendTo(openerp.client.$el);
                        var button = new openerp.im_chat.ImTopButton(this);
                        button.on("clicked", im, im.switch_display);
                        button.appendTo(window.$('.oe_systray'));
                    });
                }
            });
        },
        on_menu_action_home_inbox: function() { this.getParent().action_manager.do_action('mail.action_mail_inbox_feeds'); },
        on_menu_action_compose_mail: function() { this.getParent().action_manager.do_action('mail.action_email_compose_message_wizard'); },
        on_menu_action_calender: function() { this.getParent().action_manager.do_action('calendar.action_calendar_event'); },
        on_menu_action_partner_map: function() {
            var partner_url = document.location.origin + '/partners/map';
            window.open(partner_url, '_blank');
        },
    });
    openerp.web.form.FieldSkype = openerp.web.form.FieldChar.extend({
        template: 'FieldEmail',
        initialize_content: function() {
            this._super();
            var $button = this.$el.find('button');
            $button.click(this.on_button_clicked);
            this.setupFocus($button);
        },
        render_value: function() {
            if (!this.get("effective_readonly")) { this._super(); } else { this.$el.find('a').attr('href', 'skype:' + this.get('value') + '?call').text(this.get('value') || ''); }
        },
        on_button_clicked: function() { location.href = 'skype:' + this.get('value') + '?call'; }
    });
    openerp.web.form.widgets.add('skype', 'openerp.web.form.FieldSkype')
})();
$(document).ready(function() {
    $('.cssmenu').hover(function() {
        if (!$(this).find('h3').hasClass('fix_active')) {
            $(this).find('h3').addClass('active');
            $(this).find('div.oe_secondary_menu').stop().slideDown('slow');
        }
    }, function() {
        if (!$(this).find('h3').hasClass('fix_active')) {
            $(this).find('h3').removeClass('active');
            $(this).find('div.oe_secondary_menu').stop().slideUp('slow');
        }
    });
    $('.cssmenu > h3').click(function() {
        if ($(this).hasClass('fix_active')) {
            $(this).removeClass('fix_active');
            $(this).parent().find('div.oe_secondary_menu').stop().slideUp('slow');
        } else { $(this).addClass('fix_active'); }
    });
    $('.cssmenu .oe_menu_toggler').click(function() {
        $('.cssmenu .oe_menu_toggler').removeClass('active');
        $(this).closest('.oe_menu_toggler').addClass('active');
        var checkElement = $(this).next();
        if ((checkElement.is('.oe_secondary_submenu')) && (checkElement.is(':visible'))) {
            $(this).closest('.oe_menu_toggler').removeClass('active');
            checkElement.slideUp(1200);
        }
        if ((checkElement.is('.oe_secondary_submenu')) && (!checkElement.is(':visible'))) {
            $('#cssmenu .oe_menu_toggler:visible').slideUp(1200);
            checkElement.slideDown(1200);
        }
    });
    $('.oe_secondary_submenu li a.oe_menu_leaf').click(function() {
        $('.oe_secondary_submenu li').removeClass('active');
        $(this).parent().addClass('active');
    });

    function date_time(id) {
        date = new Date;
        year = date.getFullYear();
        month = date.getMonth();
        months = new Array('JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC');
        d = date.getDate();
        day = date.getDay();
        days = new Array('SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT');
        h = date.getHours();
        if (h < 10) { h = "0" + h; }
        m = date.getMinutes();
        if (m < 10) { m = "0" + m; }
        s = date.getSeconds();
        if (s < 10) { s = "0" + s; }
        result = '' + days[day] + ' ' + d + ' ' + months[month] + ' ' + year + ' ' + h + ':' + m + ':' + s;
        $("#date_time").text(result);
        setTimeout(function() { date_time('#date_time') }, 900);
    }
    if ($('#date_time').length >= 1) { date_time('#date_time'); }
    $('.demo_changer .demo-icon').click(function() {
        if ($('.demo_changer').hasClass("active")) { $('.demo_changer').animate({ "right": "-350px" }, function() { $('.demo_changer').toggleClass("active"); }); } else { $('.demo_changer').animate({ "right": "0px" }, function() { $('.demo_changer').toggleClass("active"); }); }
    });
    $('.styleswitch').click(function() {
        switchStylestyle(this.getAttribute("rel"));
        return false;
    });
    var c = readCookie('style');
    if (c) switchStylestyle(c);

    function switchStylestyle(styleName) {
        $('link[rel*=style][title]').each(function(i) {
            this.disabled = true;
            if (this.getAttribute('title') == styleName) this.disabled = false;
        });
        createCookie('style', styleName, 365);
    }

    function createCookie(name, value, days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            var expires = "; expires=" + date.toGMTString();
        } else var expires = "";
        document.cookie = name + "=" + value + expires + "; path=/";
    }

    function readCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function eraseCookie(name) { createCookie(name, "", -1); }
});;
