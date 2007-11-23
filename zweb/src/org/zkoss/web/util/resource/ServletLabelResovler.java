/* ServletLabelResovler.java

{{IS_NOTE
	Purpose:
		
	Description:
		
	History:
		Mon Jun 12 13:58:56     2006, Created by tomyeh
}}IS_NOTE

Copyright (C) 2006 Potix Corporation. All Rights Reserved.

{{IS_RIGHT
}}IS_RIGHT
*/
package org.zkoss.web.util.resource;

import org.zkoss.xel.VariableResolver;
import org.zkoss.xel.XelException;

import org.zkoss.util.resource.Labels;
import org.zkoss.web.el.ELContexts;
import org.zkoss.web.el.ELContext;

/**
 * Used with {@link org.zkoss.util.resource.Labels} to resolve
 * EL expressions in labels.
 *
 * @author tomyeh
 */
public class ServletLabelResovler implements VariableResolver {
	public ServletLabelResovler() {
	}
	public Object resolveVariable(String name) throws XelException {
		final Object o = Labels.getLabel(name);
		if (o != null)
			return o;

		final ELContext jc = ELContexts.getCurrent();
		if (jc != null) {
			final VariableResolver parent = jc.getVariableResolver();
			if (parent != null)
				return parent.resolveVariable(name);
		}
		return null;
	}
}
