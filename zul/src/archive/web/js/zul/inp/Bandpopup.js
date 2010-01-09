/* Bandpopup.js

	Purpose:
		
	Description:
		
	History:
		Fri Apr  3 15:24:37     2009, Created by tomyeh

Copyright (C) 2009 Potix Corporation. All Rights Reserved.

This program is distributed under LGPL Version 3.0 in the hope that
it will be useful, but WITHOUT ANY WARRANTY.
*/
/**
 * The popup that belongs to a {@link Bandbox} instance.
 *
 * <p>Developer usually listen to the onOpen event that is sent to
 * {@link Bandbox} and then creates proper components as children
 * of this component.
 *
 * <p>z-class: z-bandpopup
 */
zul.inp.Bandpopup = zk.$extends(zul.Widget, {
	//super
	getZclass: function () {
		var zcs = this._zclass;
		return zcs != null ? zcs: "z-bandpopup";
	}
});
