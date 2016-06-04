# -*- coding: utf-8 -*-
#/#############################################################################
#
#    Tech-Receptives Solutions Pvt. Ltd.
#    Copyright (C) 2004-TODAY Tech-Receptives(<http://www.tech-receptives.com>).
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
#/#############################################################################

{
    'name': 'Web Custom',
    'version': '1.0.0',
    'category': 'Hidden',
    "sequence": 1,
    'summary': 'Web Custom for ADNET™',
    'complexity': "easy",
    'description': """Customize backend style for ADNET™
    """,
    'author': 'ADSOFT',
    'website': 'https://adsoft.co.id',
    'depends': ["web"],
    'data': [
        'views/web_custom.xml',
    ],
    'demo_xml': [],
    'css': [],
    'qweb' : [
        "static/src/xml/base.xml",
    ],
    "js": [],
    'test': [],
    'installable': True,
    'auto_install': False,
    'price': 49.99, 
    'currency': 'EUR',
}
# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
