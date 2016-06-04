openerp.odoo_flatodoo_backend_theme = function(instance) {
    var _t = instance.web._t,
        _lt = instance.web._lt;
    var QWeb = instance.web.qweb;
    instance.web_kanban.KanbanGroup.include({
        do_toggle_fold: function(compute_width) {
            this.$el.add(this.$records).toggleClass('oe_kanban_group_folded');
            this.state.folded = this.$el.is('.oe_kanban_group_folded');
            this.$("ul.oe_kanban_group_dropdown li a[data-action=toggle_fold]").html('<i class="fa fa-file-text-o pr10"></i>' + ((this.state.folded) ? _t("Unfold") : _t("Fold")));
        },
    });
    instance.web_calendar.CalendarView.include({
        event_data_transform: function(evt) {
            var self = this;
            var date_delay = evt[this.date_delay] || 1.0,
                all_day = this.all_day ? evt[this.all_day] : false,
                res_computed_text = '',
                the_title = '',
                attendees = [];
            if (!all_day) {
                date_start = instance.web.auto_str_to_date(evt[this.date_start]);
                date_stop = this.date_stop ? instance.web.auto_str_to_date(evt[this.date_stop]) : null;
            } else {
                date_start = instance.web.auto_str_to_date(evt[this.date_start].split(' ')[0], 'start');
                date_stop = this.date_stop ? instance.web.auto_str_to_date(evt[this.date_stop].split(' ')[0], 'start') : null;
            }
            if (this.info_fields) {
                var temp_ret = {};
                res_computed_text = this.how_display_event;
                _.each(this.info_fields, function(fieldname) {
                    var value = evt[fieldname];
                    if (_.contains(["many2one", "one2one"], self.fields[fieldname].type)) {
                        if (value === false) { temp_ret[fieldname] = null; } else if (value instanceof Array) { temp_ret[fieldname] = value[1]; } else {
                            throw new Error("Incomplete data received from dataset for record " + evt.id);
                        }
                    } else if (_.contains(["one2many", "many2many"], self.fields[fieldname].type)) {
                        if (value === false) { temp_ret[fieldname] = null; } else if (value instanceof Array) { temp_ret[fieldname] = value; } else {
                            throw new Error("Incomplete data received from dataset for record " + evt.id);
                        }
                    } else if (_.contains(["date", "datetime"], self.fields[fieldname].type)) { temp_ret[fieldname] = instance.web.format_value(value, self.fields[fieldname]); } else { temp_ret[fieldname] = value; }
                    res_computed_text = res_computed_text.replace("[" + fieldname + "]", temp_ret[fieldname]);
                });
                if (res_computed_text.length) { the_title = res_computed_text; } else {
                    var res_text = [];
                    _.each(temp_ret, function(val, key) {
                        if (typeof(val) == 'boolean' && val == false) {} else { res_text.push(val) };
                    });
                    the_title = res_text.join(', ');
                }
                the_title = _.escape(the_title);
                the_title_avatar = '';
                if (!_.isUndefined(this.attendee_people)) {
                    var MAX_ATTENDEES = 3;
                    var attendee_showed = 0;
                    var attendee_other = '';
                    _.each(temp_ret[this.attendee_people], function(the_attendee_people) {
                        attendees.push(the_attendee_people);
                        attendee_showed += 1;
                        if (attendee_showed <= MAX_ATTENDEES) {
                            if (self.avatar_model !== null) { the_title_avatar += '<img title="' + _.escape(self.all_attendees[the_attendee_people]) + '" class="attendee_head"  \
                                                            src="/web/binary/image?model=' + self.avatar_model + '&field=image_small&id=' + the_attendee_people + '"></img>'; } else {
                                if (!self.colorIsAttendee || the_attendee_people != temp_ret[self.color_field]) {
                                    tempColor = (self.all_filters[the_attendee_people] !== undefined) ? self.all_filters[the_attendee_people].color : (self.all_filters[-1] ? self.all_filters[-1].color : 1);
                                    the_title_avatar += '<i class="fa fa-user attendee_head color_' + tempColor + '" title="' + _.escape(self.all_attendees[the_attendee_people]) + '" ></i>';
                                }
                            }
                        } else { attendee_other += _.escape(self.all_attendees[the_attendee_people]) + ", "; }
                    });
                    if (attendee_other.length > 2) { the_title_avatar += '<span class="attendee_head" title="' + attendee_other.slice(0, -2) + '">+</span>'; }
                    the_title = the_title_avatar + '<br /><div class="az_title_text">' + the_title + "</div>";
                }
            }
            if (!date_stop && date_delay) { date_stop = date_start.clone().addHours(date_delay); }
            var r = { 'start': date_start.toString('yyyy-MM-dd HH:mm:ss'), 'end': date_stop.toString('yyyy-MM-dd HH:mm:ss'), 'title': the_title, 'allDay': (this.fields[this.date_start].type == 'date' || (this.all_day && evt[this.all_day]) || false), 'id': evt.id, 'attendees': attendees };
            if (!self.useContacts || self.all_filters[evt[this.color_field]] !== undefined) {
                if (this.color_field && evt[this.color_field]) {
                    var color_key = evt[this.color_field];
                    if (typeof color_key === "object") { color_key = color_key[0]; }
                    r.className = 'cal_opacity calendar_color_' + this.get_color(color_key);
                }
            } else { r.className = 'cal_opacity calendar_color_' + self.all_filters[-1].color; }
            return r;
        },
    });
};;
