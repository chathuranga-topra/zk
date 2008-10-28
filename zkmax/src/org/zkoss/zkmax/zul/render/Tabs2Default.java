/* Tabs2Default.java

{{IS_NOTE
	Purpose:
		
	Description:
		
	History:
		Aug 22, 2008 6:03:53 PM , Created by RyanWu
}}IS_NOTE

Copyright (C) 2008 Potix Corporation. All Rights Reserved.

{{IS_RIGHT
	This program is distributed under GPL Version 2.0 in the hope that
	it will be useful, but WITHOUT ANY WARRANTY.
}}IS_RIGHT
*/
package org.zkoss.zkmax.zul.render;

import java.io.IOException;
import java.io.Writer;

import org.zkoss.zk.ui.Component;
import org.zkoss.zk.ui.render.ComponentRenderer;
import org.zkoss.zk.ui.render.SmartWriter;
import org.zkoss.zul.Tabbox;
import org.zkoss.zul.Tabs;

/**
 * {@link Tabs}'s default mold.
 * It forwards to {@link Tabs2DefaultV} if the orient is vertical.
 * 
 * @author RyanWu
 * 
 * @since 3.5.0
 */
public class Tabs2Default implements ComponentRenderer {
	private final Tabs2DefaultV _vtabs = new Tabs2DefaultV();

	public void render(Component comp, Writer out) throws IOException {
		final Tabs self = (Tabs)comp;
		final Tabbox tabbox = self.getTabbox();

		if("vertical".equals(tabbox.getOrient())) {
			_vtabs.render(comp, out);
			return;
		}

		final SmartWriter wh = new SmartWriter(out);
		final String look = tabbox.getTabLook() + '-';
		final String scroll = tabbox.isTabscroll() ? "scrolltabs" : "tabs" ;
			String uuid = self.getUuid();
			wh.write("<div id=\""+uuid+"\" class=\"").write(look+scroll).write("\" z.type=\"zul.tab2.Tabs2\"")
			    .write(self.getOuterAttrs()).write(self.getInnerAttrs()).writeln('>');
			    wh.write("<div id=\""+uuid+"!right").writeln("\"></div>");
				wh.write("<div id=\""+uuid+"!left").writeln("\"></div>");
			    wh.write("<div id=\""+uuid+"!header\"").writeln(" class=\""+look+"header\" >");
				    wh.writeln("<ul id=\""+uuid+"!cave\" class=\""+look+"ul\" >");
				    	wh.writeChildren(self);
				    	wh.writeln("<li id=\""+uuid+"!edge\" class=\""+look+"edge\" ></li>");
				    	wh.writeln("<div id=\""+uuid+"!clear\" class=\"z-clear\"></div>");
				    wh.writeln("</ul>");
			    wh.writeln("</div>");
			    wh.writeln("<div id=\""+uuid+"!line\" class=\""+look+"space\" ></div>");
			wh.writeln("</div>");
	}
}
