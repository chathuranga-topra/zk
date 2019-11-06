/* flex.js

	Purpose:
		
	Description:
		
	History:
		Fri Jun  3 14:14:21 TST 2011, Created by jumperchen

Copyright (C) 2011 Potix Corporation. All Rights Reserved.

This program is distributed under GPL Version 3.0 in the hope that
it will be useful, but WITHOUT ANY WARRANTY.
*/
(function () {
	function _getTextSize(zkc, zkp, zkpOffset) {
		var $zkc = zkc.jq,
			$prev = $zkc.prev(),
			pos = [0, 0],
			coldVal,
			poldVal,
			zs, ps;
		if ($prev.length) {
			ps = $prev[0].style;
			// ZK-700 ignore prev if not displayed
			if (!zk($prev[0]).isRealVisible()) // B65-ZK-1925: Use isRealVisible() to determine it is visible or not
				return pos;
			else {
				zs = $zkc[0].style;
				// store the old value
				coldVal = {};
				poldVal = {};
				for (var margins = ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'],
						len = margins.length; len-- > 0;) {
					coldVal[margins[len]] = zs[margins[len]];
					poldVal[margins[len]] = ps[margins[len]];

					// clean margin
					zs[margins[len]] = ps[margins[len]] = '0px';
				}
				
				var offset = $prev.zk.revisedOffset();
				pos[0] = offset[0] + $prev.zk.offsetWidth();
				pos[1] = offset[1] + $prev.zk.offsetHeight();
			}
		} else {
			pos[0] = zkpOffset[0] + zkp.sumStyles('l', jq.paddings) + zkp.sumStyles('l', jq.borders);
			pos[1] = zkpOffset[1] + zkp.sumStyles('t', jq.paddings) + zkp.sumStyles('t', jq.borders);
		}
	
		// ZK-700
		var offset = zkc.revisedOffset();
		pos[0] = offset[0] - pos[0];
		pos[1] = offset[1] - pos[1];
		
		// revert the values
		zk.copy(zs, coldVal);
		zk.copy(ps, poldVal);
			
		return [Math.max(0, pos[0]), Math.max(0, pos[1])]; // ZK-2414 and 3298164
	}
	
	// check whether the two elements are the same baseline, if so, we need to
	// sum them together.
	function _isSameBaseline(ref, cur, vertical) {
		if (vertical) {
			var hgh = ref._hgh || (ref._hgh = ref.top + ref.height),
				wdh = ref._wdh || (ref._wdh = ref.left + ref.width);
			return !(zk.ie == 10) ? cur.top >= hgh || cur.left < wdh :
				Math.round(cur.top) >= hgh || Math.round(cur.left) < wdh;
		} else {
			var hgh = ref._hgh || (ref._hgh = ref.top + ref.height),
				wdh = ref._wdh || (ref._wdh = ref.left + ref.width);
			return !(zk.ie == 10) ? cur.left >= wdh || cur.top < hgh :
				Math.round(cur.left) >= wdh || Math.round(cur.top) < hgh;
		}
	}

	function _fixMinFlex(isVflex) {
		var flexsz, sizePos, flex, offsetPos, marginPos, maxFlexPos, sumFlexPos,
			index, contentPos;
		if (isVflex) {
			flexsz = '_vflexsz';
			sizePos = 'height';
			flex = '_vflex';
			offsetPos = 'offsetHeight';
			marginPos = 'marginHeight';
			maxFlexPos = '_maxFlexHeight';
			sumFlexPos = '_sumFlexHeight';
			index = 1;
			contentPos = 'getContentEdgeHeight_';
		} else {
			flexsz = '_hflexsz';
			sizePos = 'width';
			flex = '_hflex';
			offsetPos = 'offsetWidth';
			marginPos = 'marginWidth';
			maxFlexPos = '_maxFlexWidth';
			sumFlexPos = '_sumFlexWidth';
			index = 0;
			contentPos = 'getContentEdgeWidth_';
		}
		return function (wgt, wgtn, o, min) {
			if (wgt[flexsz] === undefined) { //cached?
				var cwgt = wgt.firstChild, //bug #2928109
					n = wgtn,
					zkn = zk(n),
					max = 0;

				if (min != null)
					max = min;
				else {
					var map = {};
					map[sizePos] = 'auto';
					wgt.setFlexSize_(map, true);
					var totalsz = 0,
						vmax = 0;
					if (cwgt && cwgt.desktop) { //try child widgets, bug ZK-1575: should check if child widget is bind to desktop
						var first = cwgt,
							refDim;
						
						// ZK-2248: ignore widget dimension in vflex/hflex calculation
						while (first && first.ignoreFlexSize_(o))
							first = first.nextSibling;
						
						for (; cwgt; cwgt = cwgt.nextSibling) { //bug 3132199: hflex="min" in hlayout
							if (!cwgt.ignoreFlexSize_(o)) {
								var c = cwgt.$n();
								if (c) { //node might not exist if rod on
									//Skip absolute or fixed DOM element size
									var cpos = c.style.position;
									if (cpos == 'absolute' || cpos == 'fixed')
										continue;
									
									var zkc = zk(c),
										sz = 0;
									if (cwgt[flex] == 'min') {
										if (zkc.isVisible()) {
											sz += cwgt[flexsz] === undefined ? zFlex.fixMinFlex(cwgt, c, o) : cwgt[flexsz];
										}
									} else {
										cwgt.beforeParentMinFlex_(o);
										sz += wgt.getChildMinSize_(o, cwgt) // fixed for B50-3157031.zul
												+ zkc[marginPos]();
									}
									
									//bug #3006276: East/West bottom cut if East/West higher than Center.
									if (cwgt[maxFlexPos] && sz > vmax) //@See West/East/Center
										vmax = sz;
									else if (cwgt[sumFlexPos]) //@See North/South
										totalsz += sz;
									else if (!cwgt[maxFlexPos] && first != cwgt
											&& _isSameBaseline(refDim || (refDim = zk(first).dimension(true)), zkc.dimension(true), isVflex))
										max += sz;
									else if (sz > max)
										max = sz;
								}
							}
						}
					} else {
						var c = wgtn.firstChild;
						if (c) { //no child widget, try html element directly
							//feature 3000339: The hflex of the cloumn will calculate by max width
							var isText = c.nodeType == 3,
								ignore = wgt.ignoreChildNodeOffset_(o),
								first = c,
								refDim;
							for (; c; c = c.nextSibling) {
								//Skip absolute or fixed DOM element size
								isText = c.nodeType == 3; // Bug ZK-2275, we need to update c.nodeType
								if (!isText) {
									var cpos = c.style.position;
									if (cpos == 'absolute' || cpos == 'fixed')
										continue;
								}
								
								var zkc = zk(c),
									sz = 0;
								if (ignore) {
									for (var el = c.firstChild; el; el = el.nextSibling) {
										var txt = el && el.nodeType == 3 ? el.nodeValue : null,
											zel;
										if (txt) {
											var dim = zkc.textSize(txt);
											if (dim[1] > sz)
												sz = dim[1];
										} else if ((zel = zk(el)).isVisible()) {
											var s = zel[offsetPos]() + zel[marginPos]();
											if (s > sz)
												sz = s;
										}
									}
								} else {
									if (isText)
										sz = c.nodeValue ? zkn.textSize(c.nodeValue)[index] : 0;
									else {
										sz = zkc[offsetPos]() + zkc[marginPos]();
									}
								}
								if (isText) {
									if (sz > max)
										max = sz;
								} else {
									var curDim = zkc.dimension(true);
									if (_isSameBaseline(refDim || (refDim = zk(first).dimension(true)),
											curDim, isVflex))
										max += sz;
									else if (sz > max)
										max = sz;
								}
							}
						} else //no kids at all, use self
							max = zkn[offsetPos]();
					}
					if (vmax)
						totalsz += vmax;
					if (totalsz > max)
						max = totalsz;
				}

				//bug #3005284: (Chrome)Groupbox hflex="min" in borderlayout wrong sized
				//bug #3006707: The title of the groupbox shouldn't be strikethrough(Chrome)
				var margin = wgt.getMarginSize_(o);
				if (zk.webkit && margin < 0)
					margin = 0;

				
				// ZK-970: refixed for caption
				var map = {},
					n = wgt.$n(),
					hasChildren = zk.isLoaded('zul.wgt') && wgt.$instanceof(zul.wgt.Caption) && wgt.nChildren > 0,
					size = hasChildren ? zk(wgt.$n('cave'))[offsetPos]() : max;

				map[sizePos] = size + wgt[contentPos](size);
				var s = wgt.setFlexSize_(map, true);
				sz = {height: n.offsetHeight, width: (s && s.width) || n.offsetWidth};
				if (sz && sz[sizePos] >= 0)
					wgt[flexsz] = sz[sizePos] + margin;

				var ebody = wgt.ebody;
				if (ebody && wgt[flex] == 'min')
					wgt[flexsz] += (zk(ebody)[isVflex ? 'hasHScroll' : 'hasVScroll']() ? jq.scrollbarWidth() : 0);

				wgt.afterChildrenMinFlex_(o);
				
				// notify my parent when my size has been changed and my parent is not in min flex
				// Bug ZK-2117
				if (wgt.parent && wgt.parent[flex] != 'min')
					wgt.parent.afterChildMinFlexChanged_(wgt, o);
			}
			return wgt[flexsz];
		};
	}
	var _fixMinVflex = _fixMinFlex(true),
		_fixMinHflex = _fixMinFlex();
	function _zero() {
		return 0;
	}

zFlex = { //static methods
	beforeSize: function (ctl, opts, cleanup) {
		var wgt = this, p;
		if (cleanup)
			wgt.clearCachedSize_();
		
		//bug#3042306: H/Vflex in IE6 can't shrink; others cause scrollbar space
		if (!zk.mounting && wgt.isRealVisible()) {
			if (wgt._hflex && wgt._hflex != 'min') {
				wgt.resetSize_('w');
				// Bug ZK-597
				delete wgt._flexFixed;
				if (p = wgt.parent)
					p.afterResetChildSize_('w');
			}
			if (wgt._vflex && wgt._vflex != 'min') {
				wgt.resetSize_('h');
				// Bug ZK-597
				delete wgt._flexFixed;
				if (p = wgt.parent)
					p.afterResetChildSize_('h');
			}
		}
	},
	onSize: function () {
		zFlex.fixFlex(this);
	},
	fixFlex: function (wgt) {
		if (wgt._flexFixed || (!wgt._nvflex && !wgt._nhflex)) { //other vflex/hflex sibliing has done it!
			delete wgt._flexFixed;
			return;
		}
		//avoid firedown("onSize") calling in again
		if ((wgt._vflex === undefined || (wgt._vflexsz && wgt._vflex == 'min'))
			&& (wgt._hflex === undefined || (wgt._hflexsz && wgt._hflex == 'min')))
			return;

		if (wgt.ignoreFlexSize_('w') && wgt.ignoreFlexSize_('h'))
			return;

		if (!wgt.parent.beforeChildrenFlex_(wgt)) { //don't do fixflex if return false
			return;
		}
		wgt._flexFixed = true;
		
		var pretxt = false, //pre node is a text node
			vflexs = [],
			vflexsz = 0,
			hflexs = [],
			hflexsz = 0,
			p = wgt.$n().parentNode,
			zkp = zk(p),
			psz = wgt.getParentSize_(p),
			hgh = psz.height,
			wdh = psz.width,
			c = p.firstChild,
			vflexsRe = [],
			hasVScroll = zkp.hasVScroll(),
			hasHScroll = zkp.hasHScroll(),
			scrollbarWidth = jq.scrollbarWidth(),
			isMeshLoaded = zk.isLoaded('zul.mesh');

		// B86-ZK-4123
		if (isMeshLoaded && wgt.$instanceof(zul.mesh.HeaderWidget)) {
			var mesh = wgt.parent.parent;
			if (mesh._nativebar) {
				var body = mesh.ebody,
					meshBodyHasVScroll = zk(body).hasVScroll(),
					meshBodyHasHScroll = zk(body).hasHScroll();
			}
		}

		// Bug 3185686, B50-ZK-452
		if (hasVScroll || meshBodyHasVScroll) //with vertical scrollbar
			wdh -= scrollbarWidth;
			
		// B50-3312936.zul
		if (hasHScroll || meshBodyHasHScroll) //with horizontal scrollbar
			hgh -= scrollbarWidth;
			
		for (; c; c = c.nextSibling)
			if (c.nodeType != 3) break; //until not a text node

		for (var zkpOffset; c; c = c.nextSibling) {
			//In ZK, we assume all text node is space (otherwise, it will be span enclosed)
			if (c.nodeType === 3) { //a text node
				pretxt = true;
				continue;
			}
			//Skip absolute or fixed DOM element size
			var cpos = c.style.position;
			if (cpos == 'absolute' || cpos == 'fixed')
				continue;
			
			var zkc = zk(c);
			if (zkc.isVisible(true)) {
				var offhgh = zkc.offsetHeight(),
					offwdh = offhgh > 0 ? zkc.offsetWidth() : 0,
					cwgt = zk.Widget.$(c, {exact: 1});
					
				//ZK-2776: we can't and shouldn't set width to auxheader
				if (cwgt && isMeshLoaded && cwgt.$instanceof(zul.mesh.Auxheader))
					continue;
				
				//Bug ZK-1647: should consider header width
				//Bug Flex-138: skip if width exists
				if (offwdh == 0 && cwgt && isMeshLoaded
						&& cwgt.$instanceof(zul.mesh.HeaderWidget)) {
					// don't use jq().width() in chrome for performance issue
					var hdfaker = cwgt.$n('hdfaker');
					offwdh = hdfaker ? zk.parseInt(hdfaker.style.width) || hdfaker.offsetWidth : 0; //use faker width
				}
				
				//Bug ZK-1706: should consider all text node size
				if (pretxt) {
					if (!zkpOffset)
						zkpOffset = zkp.revisedOffset();
					var size = _getTextSize(zkc, zkp, zkpOffset);
					if (!cwgt || !cwgt.isExcludedHflex_()) // fixed ZK-1706 sideeffect
						wdh -= size[0];
					if (!cwgt || !cwgt.isExcludedVflex_()) // fixed ZK-1706 sideeffect for B60-ZK-917.zul
						hgh -= size[1];
				}
				//horizontal size
				if (cwgt && cwgt._nhflex && cwgt.isVisible()) { //Bug ZK-3883: to prevent invisible cwgt
					if (cwgt !== wgt)
						cwgt._flexFixed = true; //tell other hflex siblings I have done it.
					if (cwgt._hflex == 'min') {
						wdh -= zFlex.fixMinFlex(cwgt, c, 'w');
					} else {
						hflexs.push(cwgt);
						hflexsz += cwgt._nhflex;
					}
				} else if ((!cwgt &&
						// panelchild cannot include panel's bottombar.
						(!zk.isLoaded('zul.wnd') || !wgt.$instanceof(zul.wnd.Panelchildren)))
						|| (cwgt && !cwgt.isExcludedHflex_())) {
					wdh -= offwdh;
					wdh -= zkc.marginWidth();
				}
				
				//vertical size
				if (cwgt && cwgt._nvflex && cwgt.isVisible()) { //Bug ZK-3883: to prevent invisible cwgt
					if (cwgt !== wgt)
						cwgt._flexFixed = true; //tell other vflex siblings I have done it.
					if (cwgt._vflex == 'min') {
						hgh -= zFlex.fixMinFlex(cwgt, c, 'h');
					} else {
						vflexs.push(cwgt);
						vflexsRe.push(cwgt);
						vflexsz += cwgt._nvflex;
					}
				} else if (!cwgt || !cwgt.isExcludedVflex_()) {
					hgh -= offhgh;
					hgh -= zkc.marginHeight();
				}
				
				pretxt = false;
			}
		}

		// ZK-3411: use local function for setting up height
		var setHghForVflexChild = function (vfxs, h, lsz) {
			for (var j = vfxs.length - 1; j > 0; --j) {
				var cwgt = vfxs.shift(),
					vsz = cwgt.isExcludedVflex_() ? h : (cwgt._nvflex * h / vflexsz) | 0; //cast to integer
				cwgt.setFlexSize_({height: vsz});
				cwgt._vflexsz = vsz;
				if (!cwgt.isExcludedVflex_())
					lsz -= vsz;
			}
			//last one with vflex
			if (vfxs.length) {
				var cwgt = vfxs.shift();
				cwgt.setFlexSize_({height: lsz});
				cwgt._vflexsz = lsz;
			}
		};

		//setup the height for the vflex child
		//avoid floating number calculation error(TODO: shall distribute error evenly)
		var lastsz = hgh = Math.max(hgh, 0);
		setHghForVflexChild(vflexs, hgh, lastsz);

		//3042306: H/Vflex in IE6 can't shrink; others cause scrollbar space
		//vertical scrollbar might disappear after height was set
		var newpsz = wgt.getParentSize_(p);
		if (newpsz.width > psz.width) {//yes, the scrollbar gone!
			wdh += (newpsz.width - psz.width);
		} else if (!zkp.hasVScroll() && hasVScroll) { // ZK-3858: Window inside a <center> with autoscroll true doesn't resize itself correctly
			wdh += scrollbarWidth;
		}

		//setup the width for the hflex child
		//avoid floating number calculation error(TODO: shall distribute error evenly)
		lastsz = wdh = Math.max(wdh, 0);
		for (var j = hflexs.length - 1; j > 0; --j) {
			var cwgt = hflexs.shift(), //{n: node, f: hflex}
				hsz = cwgt.isExcludedHflex_() ? wdh : (cwgt._nhflex * wdh / hflexsz) | 0; //cast to integer
			cwgt.setFlexSize_({width: hsz});
			cwgt._hflexsz = hsz;
			if (!cwgt.isExcludedHflex_())
				lastsz -= hsz;
		}
		//last one with hflex
		if (hflexs.length) {
			var cwgt = hflexs.shift();
			cwgt.setFlexSize_({width: lastsz});
			cwgt._hflexsz = lastsz;
		}

		// ZK-3411: height need to be reset if the horizontal scrollbar disappeared
		var fixForParentHeight = newpsz.height > psz.height,
			fixForParentHScroll = !zkp.hasHScroll() && hasHScroll;
		if (fixForParentHeight || fixForParentHScroll) {   //horizontal scrollbar disappeared
			if (fixForParentHeight) {
				hgh += (newpsz.height - psz.height);
			} else if (fixForParentHScroll) { // ZK-3858: Window inside a <center> with autoscroll true doesn't resize itself correctly
				hgh += scrollbarWidth;
			}
			lastsz = hgh = Math.max(hgh, 0);
			setHghForVflexChild(vflexsRe, hgh, lastsz);
		}

		//notify parent widget that all of its children with hflex/vflex is done.
		wgt.parent.afterChildrenFlex_(wgt);
		wgt._flexFixed = false;
	},
	onFitSize: function () {
		var wgt = this,
			c = wgt.$n();
		if (c && zk(c).isVisible()) {
			// Bug ZK-3014: offsetWidth will be available only when wgt is real visible
			if (wgt._hflex == 'min' && wgt._hflexsz === undefined && wgt.isRealVisible() && !wgt.ignoreFlexSize_('w'))
				zFlex.fixMinFlex(wgt, c, 'w');
			// Bug ZK-3014: offsetHeight will be available only when wgt is real visible
			if (wgt._vflex == 'min' && wgt._vflexsz === undefined && wgt.isRealVisible() && !wgt.ignoreFlexSize_('h'))
				zFlex.fixMinFlex(wgt, c, 'h');
		}
	},
	fixMinFlex: function (wgt, wgtn, o) {
		//find the max size of all children
		return (o == 'h' ? _fixMinVflex : o == 'w' ? _fixMinHflex : _zero)(wgt, wgtn, o, wgt.beforeMinFlex_(o));
	},
	fixCSSFlex: function (forced) {
		var wgt = this;
		if ((!forced && wgt._flexFixed) || (!wgt._nvflex && !wgt._nhflex)) { //other vflex/hflex sibling has done it!
			return;
		}
		var pwgt = wgt.parent,
			fContainer = pwgt.$instanceof(zk.Page) ? pwgt.$n() : pwgt.getFlexContainer_();
		if (fContainer == null) { //using old flex
			wgt._cssflex = false;
			return;
		}

		var flexInfo = zFlex.getFlexInfo(wgt),
			flexD = flexInfo.flexDirection,
			isRow = 'row' == flexD,
			fccs = flexInfo.flexContainerChildren,
			cwgts = flexInfo.childrenWidgets,
			isAllMin = true,
			fdArr = [],
			cwgtsz = [];

		for (var i = 0, length = fccs.length; i < length; i++) {
			var fcc = fccs[i],
				cwgt = cwgts[i],
				c = cwgt.$n(),
				flexs = [cwgt._nvflex, cwgt._nhflex],
				sz = {},
				dim = isRow ? 'width' : 'height';

			var flex = flexs[isRow | 0];
			if (flex > 0) {
				isAllMin = false;
				fcc.style['flex'] = flex + ' 1 0';
				fcc.style['min-height'] = '0';
				fcc.style['min-width'] = '0';
				sz[dim] = 'auto';
				if (fcc != c && !c.style[dim])
					c.style[dim] = '100%';
			} else if (flex < 0) //min
				zFlex.fixMinFlex(cwgt, c, dim.substring(0, 1));

			//check else flex
			flex = flexs[!isRow | 0];
			dim = isRow ? 'height' : 'width';
			if (flex > 0) {
				var marginSize = 0,
					jqFcc = jq(fcc);
				if (isRow)
					marginSize = jqFcc.outerHeight(true) - jqFcc.outerHeight();
				else
					marginSize = jqFcc.outerWidth(true) - jqFcc.outerWidth();
				var fccDimValue = '100%';
				if (marginSize > 0) //handle margin issue
					fccDimValue = 'calc(100% - ' + jq.px0(marginSize) + ')';
				fcc.style[dim] = fccDimValue;
				sz[dim] = 'auto';
				if (fcc != c)
					c.style[dim] = '100%';
			} else if (flex < 0)//min
				zFlex.fixMinFlex(cwgt, c, dim.substring(0, 1));
			cwgtsz.push(sz);
		}

		if (!isAllMin) {
			fContainer.style.display = 'flex';
			fContainer.style['flex-direction'] = flexD;
		}

		for (var i = 0, length = cwgtsz.length; i < length; i++) {
			var sz = cwgtsz[i];
			if (Object.keys(sz).length > 0) //es5
				cwgts[i].setFlexSize_(sz);
		}

		pwgt.afterChildrenFlex_(wgt);
	},
	clearCSSFlex: function (wgt, o, clearAllSiblings) {
		if (!wgt._flexFixed) return;

		var pwgt = wgt.parent,
			fContainer = pwgt.$instanceof(zk.Page) ? pwgt.$n() : pwgt.getFlexContainer_(),
			isHorizontal = o == 'h',
			flexInfo = zFlex.getFlexInfo(wgt),
			isRow = 'row' == flexInfo.flexDirection,
			fccs = flexInfo.flexContainerChildren,
			cwgts = flexInfo.childrenWidgets,
			fdArr = [],
			cwgtsz = [],
			noSibFlex = true;

		for (var i = 0, length = fccs.length; i < length; i++) {
			var fcc = fccs[i],
				cwgt = cwgts[i],
				isTargetWgt = cwgt == wgt,
				c = cwgt.$n(),
				flexs = [cwgt._vflex, cwgt._nflex],
				dim = isRow ? 'width' : 'height';

			var flex = flexs[isRow | 0];
			if ('min' != flex && (true === flex || 'true' == flex || zk.parseInt(flex) > 0)) {
				if ((clearAllSiblings || isTargetWgt) && (isHorizontal && isRow) || (!isHorizontal && !isRow)) {
					fcc.style['flex'] = '';
					fcc.style['min-height'] = '';
					fcc.style['min-width'] = '';
					if (fcc != c && !c.style[dim])
						c.style[dim] = '';
				}
			}

			//check else flex
			flex = flexs[!isRow | 0];
			dim = isRow ? 'height' : 'width';
			if ('min' != flex && (true === flex || 'true' == flex || zk.parseInt(flex) > 0)) {
				if (clearAllSiblings || isTargetWgt) {
					if ((isHorizontal && !isRow) || (!isHorizontal && isRow)) {
						fcc.style[dim] = '';
						if (fcc != c)
							c.style[dim] = '';
					}
				} else
					noSibFlex = noSibFlex ? !fcc.style['flex'] : false;
			}
		}

		if (clearAllSiblings || noSibFlex) {
			fContainer.style.display = '';
			fContainer.style['flex-direction'] = '';
		}
		wgt.afterClearFlex_();
	},
	getFlexInfo: function (wgt) {
		var pwgt = wgt.parent,
			cwgt = pwgt.firstChild,
			fContainer = pwgt.getFlexContainer_(),
			fcc = fContainer.firstElementChild,
			flexD = pwgt.getFlexDirection_(),
			isRow = 'row' == flexD,
			fccs = [],
			cwgts = [],
			checkColumn = flexD == null,
			toColumn = !isRow;

		for (var c; fcc && cwgt;) { // assume fcc <-> cwgt 1-1 mapping
			c = cwgt.$n();
			if (c) {
				if (!fContainer.contains(c)) { // skip moved dom (ex.caption)
					cwgt = cwgt.nextSibling;
					continue;
				} else {
					if (c && fcc.contains(c)) {
						cwgt._flexFixed = true;
						fccs.push(fcc);
						cwgts.push(cwgt);
						if (checkColumn && !toColumn && isRow && jq(fcc).css('display') === 'block') // isRow, find block first
							toColumn = true;
					}
				}
			}
			fcc = fcc.nextElementSibling;
			cwgt = cwgt.nextSibling;
		}
		if (toColumn)
			flexD = 'column';
		else if (flexD == null) //default and no block
			flexD = 'row';
		return {flexDirection: flexD, flexContainerChildren: fccs, childrenWidgets: cwgts};
	}
};
})();
