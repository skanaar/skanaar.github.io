/* Riot v3.9.0, @license MIT */
var e,t;e=this,t=function(){"use strict";function e(e,t){return(t||document).querySelector(e)}var t,n,r=[],i={},o="yield",s="__global_mixin",a="riot-",u=["ref","data-ref"],l="data-is",c="if",p="each",f="no-reorder",d="show",h="hide",m="key",g="__riot-events__",v="string",x="object",y="undefined",b="function",w="http://www.w3.org/1999/xlink",_="http://www.w3.org/2000/svg",A=/^xlink:(\w+)/,O=typeof window===y?void 0:window,N=/^on/,E=/([-\w]+) ?= ?(?:"([^"]*)|'([^']*)|({[^}]*}))/g,C={viewbox:"viewBox",preserveaspectratio:"preserveAspectRatio"},j=/^(?:disabled|checked|readonly|required|allowfullscreen|auto(?:focus|play)|compact|controls|default|formnovalidate|hidden|ismap|itemscope|loop|multiple|muted|no(?:resize|shade|validate|wrap)?|open|reversed|seamless|selected|sortable|truespeed|typemustmatch)$/,S=0|(O&&O.document||{}).documentMode;function k(e){return"svg"===e?document.createElementNS(_,e):document.createElement(e)}function T(e,t,n){var r=A.exec(t);r&&r[1]?e.setAttributeNS(w,r[1],n):e.setAttribute(t,n)}var L,I,R={},M=[],P=!1;O&&(L=k("style"),I=e("style[type=riot]"),T(L,"type","text/css"),I?(I.id&&(L.id=I.id),I.parentNode.replaceChild(L,I)):document.head.appendChild(L),n=(t=L).styleSheet);var $={styleNode:t,add:function(e,t){t?R[t]=e:M.push(e),P=!0},inject:function(){if(O&&P){P=!1;var e=Object.keys(R).map(function(e){return R[e]}).concat(M).join("\n");n?n.cssText=e:t.innerHTML=e}}},F=function(){var e="[{(,;:?=|&!^~>%*/",t=["case","default","do","else","in","instanceof","prefix","return","typeof","void","yield"],n=t.reduce(function(e,t){return e+t.slice(-1)},""),r=/^\/(?=[^*>/])[^[/\\]*(?:(?:\\.|\[(?:\\.|[^\]\\]*)*\])[^[\\/]*)*?\/[gimuy]*/,i=/[$\w]/;function o(e,t){for(;--t>=0&&/\s/.test(e[t]););return t}return function(s,a){var u=/.*/g,l=u.lastIndex=a++,c=u.exec(s)[0].match(r);if(c){var p=l+c[0].length,f=s[l=o(s,l)];if(l<0||~e.indexOf(f))return p;if("."===f)"."===s[l-1]&&(a=p);else if("+"===f||"-"===f)(s[--l]!==f||(l=o(s,l))<0||!i.test(s[l]))&&(a=p);else if(~n.indexOf(f)){for(var d=l+1;--l>=0&&i.test(s[l]););~t.indexOf(s.slice(l+1,d))&&(a=p)}}return a}}(),z=function(e){var t,n,r="g",i=/"[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'|`[^`\\]*(?:\\[\S\s][^`\\]*)*`/g,o=i.source+"|"+/(?:\breturn\s+|(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/]))/.source+"|"+/\/(?=[^*\/])[^[\/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[\/\\]*)*?([^<]\/)[gim]*/.source,s=RegExp("[\\x00-\\x1F<>a-zA-Z0-9'\",;\\\\]"),a=/(?=[[\]()*+?.^$|])/g,u=i.source+"|"+/(\/)(?![*\/])/.source,l={"(":RegExp("([()])|"+u,r),"[":RegExp("([[\\]])|"+u,r),"{":RegExp("([{}])|"+u,r)},c="{ }",p=["{","}","{","}",/{[^}]*}/,/\\([{}])/g,/\\({)|{/g,RegExp("\\\\(})|([[({])|(})|"+u,r),c,/^\s*{\^?\s*([$\w]+)(?:\s*,\s*(\S+))?\s+in\s+(\S.*)\s*}/,/(^|[^\\]){=[\S\s]*?}/],f=void 0,d=[];function h(e){return e}function m(e,t){return t||(t=d),new RegExp(e.source.replace(/{/g,t[2]).replace(/}/g,t[3]),e.global?r:"")}function g(e){if(e===c)return p;var t=e.split(" ");if(2!==t.length||s.test(e))throw new Error('Unsupported brackets "'+e+'"');return(t=t.concat(e.replace(a,"\\").split(" ")))[4]=m(t[1].length>1?/{[\S\s]*?}/:p[4],t),t[5]=m(e.length>3?/\\({|})/g:p[5],t),t[6]=m(p[6],t),t[7]=RegExp("\\\\("+t[3]+")|([[({])|("+t[3]+")|"+u,r),t[8]=e,t}function v(e){return e instanceof RegExp?t(e):d[e]}function x(e){(e||(e=c))!==d[8]&&(d=g(e),t=e===c?h:m,d[9]=t(p[9])),f=e}return v.split=function(e,t,n){n||(n=d);var r,i,o,s,a,u,c=[],p=n[6],f=[],h="";for(i=o=p.lastIndex=0;r=p.exec(e);){if(u=p.lastIndex,s=r.index,i){if(r[2]){var m=r[2],g=l[m],v=1;for(g.lastIndex=u;r=g.exec(e);)if(r[1]){if(r[1]===m)++v;else if(!--v)break}else g.lastIndex=y(r.index,g.lastIndex,r[2]);p.lastIndex=v?e.length:g.lastIndex;continue}if(!r[3]){p.lastIndex=y(s,u,r[4]);continue}}r[1]||(x(e.slice(o,s)),o=p.lastIndex,(p=n[6+(i^=1)]).lastIndex=o)}return e&&o<e.length&&x(e.slice(o)),c.qblocks=f,c;function x(e){h&&(e=h+e,h=""),t||i?c.push(e&&e.replace(n[5],"$1")):c.push(e)}function y(n,r,i){return i&&(r=F(e,n)),t&&r>n+2&&(a="⁗"+f.length+"~",f.push(e.slice(n,r)),h+=e.slice(o,n)+a,o=r),r}},v.hasExpr=function(e){return d[4].test(e)},v.loopKeys=function(e){var t=e.match(d[9]);return t?{key:t[1],pos:t[2],val:d[0]+t[3].trim()+d[1]}:{val:e.trim()}},v.array=function(e){return e?g(e):d},Object.defineProperty(v,"settings",{set:function(e){var t;t=(e=e||{}).brackets,Object.defineProperty(e,"brackets",{set:x,get:function(){return f},enumerable:!0}),n=e,x(t)},get:function(){return n}}),v.settings="undefined"!=typeof riot&&riot.settings||{},v.set=x,v.skipRegex=F,v.R_STRINGS=i,v.R_MLCOMMS=/\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//g,v.S_QBLOCKS=o,v.S_QBLOCK2=u,v}(),H=function(){var e={};function t(i,o){return i?(e[i]||(e[i]=function(e){var t=function(e){var t,i=z.split(e.replace(n,'"'),1),o=i.qblocks;if(i.length>2||i[0]){var a,u,l=[];for(a=u=0;a<i.length;++a)(t=i[a])&&(t=1&a?s(t,1,o):'"'+t.replace(/\\/g,"\\\\").replace(/\r\n?|\n/g,"\\n").replace(/"/g,'\\"')+'"')&&(l[u++]=t);t=u<2?l[0]:"["+l.join(",")+'].join("")'}else t=s(i[1],0,o);o.length&&(t=t.replace(r,function(e,t){return o[t].replace(/\r/g,"\\r").replace(/\n/g,"\\n")}));return t}(e);"try{return "!==t.slice(0,11)&&(t="return "+t);return new Function("E",t+";")}(i))).call(o,function(e,n){e.riotData={tagName:n&&n.__&&n.__.tagName,_riot_id:n&&n._riot_id},t.errorHandler?t.errorHandler(e):"undefined"!=typeof console&&"function"==typeof console.error&&(console.error(e.message),console.log("<%s> %s",e.riotData.tagName||"Unknown tag",this.tmpl),console.log(this.data))}.bind({data:o,tmpl:i})):i}t.hasExpr=z.hasExpr,t.loopKeys=z.loopKeys,t.clearCache=function(){e={}},t.errorHandler=null;var n=/\u2057/g,r=/\u2057(\d+)~/g;var i=/^(?:(-?[_A-Za-z\xA0-\xFF][-\w\xA0-\xFF]*)|\u2057(\d+)~):/,o={"(":/[()]/g,"[":/[[\]]/g,"{":/[{}]/g};function s(e,t,n){if(e=e.replace(/\s+/g," ").trim().replace(/\ ?([[\({},?\.:])\ ?/g,"$1")){for(var r,s=[],a=0;e&&(r=e.match(i))&&!r.index;){var u,l,p=/,|([[{(])|$/g;for(e=RegExp.rightContext,u=r[2]?n[r[2]].slice(1,-1).trim().replace(/\s+/g," "):r[1];l=(r=p.exec(e))[1];)f(l,p);l=e.slice(0,r.index),e=RegExp.rightContext,s[a++]=c(l,1,u)}e=a?a>1?"["+s.join(",")+'].join(" ").trim()':s[0]:c(e,t)}return e;function f(t,n){var r,i=1,s=o[t];for(s.lastIndex=n.lastIndex;r=s.exec(e);)if(r[0]===t)++i;else if(!--i)break;n.lastIndex=i?e.length:s.lastIndex}}var a='"in this?this:'+("object"!=typeof window?"global":"window")+").",u=/[,{][\$\w]+(?=:)|(^ *|[^$\w\.{])(?!(?:typeof|true|false|null|undefined|in|instanceof|is(?:Finite|NaN)|void|NaN|new|Date|RegExp|Math)(?![$\w]))([$_A-Za-z][$\w]*)/g,l=/^(?=(\.[$\w]+))\1(?:[^.[(]|$)/;function c(e,t,n){var r;return e=e.replace(u,function(e,t,n,i,o){return n&&(i=r?0:i+e.length,"this"!==n&&"global"!==n&&"window"!==n?(e=t+'("'+n+a+n,i&&(r="."===(o=o[i])||"("===o||"["===o)):i&&(r=!l.test(o.slice(i)))),e}),r&&(e="try{return "+e+"}catch(e){E(e,this)}"),n?e=(r?"function(){"+e+"}.call(this)":"("+e+")")+'?"'+n+'":""':t&&(e="function(v){"+(r?e.replace("return ","v="):"v=("+e+")")+';return v||v===0?v:""}.call(this)'),e}return t.version=z.version="v3.0.8",t}(),U=function(e){e=e||{};var t={},n=Array.prototype.slice;return Object.defineProperties(e,{on:{value:function(n,r){return"function"==typeof r&&(t[n]=t[n]||[]).push(r),e},enumerable:!1,writable:!1,configurable:!1},off:{value:function(n,r){if("*"!=n||r)if(r)for(var i,o=t[n],s=0;i=o&&o[s];++s)i==r&&o.splice(s--,1);else delete t[n];else t={};return e},enumerable:!1,writable:!1,configurable:!1},one:{value:function(t,n){return e.on(t,function r(){e.off(t,r),n.apply(e,arguments)})},enumerable:!1,writable:!1,configurable:!1},trigger:{value:function(r){var i,o,s,a=arguments,u=arguments.length-1,l=new Array(u);for(s=0;s<u;s++)l[s]=a[s+1];for(i=n.call(t[r]||[],0),s=0;o=i[s];++s)o.apply(e,l);return t["*"]&&"*"!=r&&e.trigger.apply(e,["*",r].concat(l)),e},enumerable:!1,writable:!1,configurable:!1}}),e};function V(e,t){return Object.getOwnPropertyDescriptor(e,t)}function B(e){return typeof e===y}function q(e,t){var n=V(e,t);return B(e[t])||n&&n.writable}function D(e){for(var t,n=1,r=arguments,i=r.length;n<i;n++)if(t=r[n])for(var o in t)q(e,o)&&(e[o]=t[o]);return e}function Z(e){return Object.create(e)}var G=D(Z(z.settings),{skipAnonymousTags:!0,autoUpdate:!0});function K(e,t){return[].slice.call((t||document).querySelectorAll(e))}function W(){return document.createTextNode("")}function J(e,t){e.style.display=t?"":"none",e.hidden=!t}function Q(e,t){return e.getAttribute(t)}function X(e,t){e.removeAttribute(t)}function Y(e,t,n){if(n){var r=e.ownerDocument.importNode((new DOMParser).parseFromString('<svg xmlns="'+_+'">'+t+"</svg>","application/xml").documentElement,!0);e.appendChild(r)}else e.innerHTML=t}function ee(e,t){if(e)for(var n;n=E.exec(e);)t(n[1].toLowerCase(),n[2]||n[3]||n[4])}function te(){return document.createDocumentFragment()}function ne(e,t,n){e.insertBefore(t,n.parentNode&&n)}function re(e){return Object.keys(e).reduce(function(t,n){return t+" "+n+": "+e[n]+";"},"")}function ie(e,t,n){if(e){var r,i=t(e,n);if(!1===i)return;for(e=e.firstChild;e;)r=e.nextSibling,ie(e,t,i),e=r}}var oe=Object.freeze({$$:K,$:e,createDOMPlaceholder:W,mkEl:k,setAttr:T,toggleVisibility:J,getAttr:Q,remAttr:X,setInnerHTML:Y,walkAttrs:ee,createFrag:te,safeInsert:ne,styleObjectToString:re,walkNodes:ie});function se(e){return B(e)||null===e}function ae(e){return se(e)||""===e}function ue(e){return typeof e===b}function le(e){return e&&typeof e===x}function ce(e){var t=e.ownerSVGElement;return!!t||null===t}function pe(e){return Array.isArray(e)||e instanceof Array}function fe(e){return j.test(e)}function de(e){return typeof e===v}var he=Object.freeze({isBlank:ae,isFunction:ue,isObject:le,isSvg:ce,isWritable:q,isArray:pe,isBoolAttr:fe,isNil:se,isString:de,isUndefined:B});function me(e,t){return-1!==e.indexOf(t)}function ge(e,t){for(var n=e?e.length:0,r=0;r<n;r++)t(e[r],r);return e}function ve(e,t){return e.slice(0,t.length)===t}var xe,ye=(xe=-1,function(){return++xe});function be(e,t,n,r){return Object.defineProperty(e,t,D({value:n,enumerable:!1,writable:!1,configurable:!0},r)),e}function we(e){return e.replace(/-(\w)/g,function(e,t){return t.toUpperCase()})}function _e(e){console&&console.warn&&console.warn(e)}var Ae=Object.freeze({contains:me,each:ge,getPropDescriptor:V,startsWith:ve,uid:ye,defineProperty:be,objectCreate:Z,extend:D,toCamel:we,warn:_e});function Oe(e,t,n,r,i){var o=e[t],s=pe(o),a=!B(i);if(!o||o!==n)if(!o&&r)e[t]=[n];else if(o)if(s){var u=o.indexOf(n);if(u===i)return;-1!==u&&o.splice(u,1),a?o.splice(i,0,n):o.push(n)}else e[t]=[o,n];else e[t]=n}function Ne(e){return e.tagName&&i[Q(e,l)||Q(e,l)||e.tagName.toLowerCase()]}function Ee(e,t){var n=Ne(e),r=!t&&Q(e,l);return r&&!H.hasExpr(r)?r:n?n.name:e.tagName.toLowerCase()}function Ce(){return this.parent?D(Z(this),this.parent):this}var je=/<yield\b/i,Se=/<yield\s*(?:\/>|>([\S\s]*?)<\/yield\s*>|>)/gi,ke=/<yield\s+to=['"]([^'">]*)['"]\s*>([\S\s]*?)<\/yield\s*>/gi,Te=/<yield\s+from=['"]?([-\w]+)['"]?\s*(?:\/>|>([\S\s]*?)<\/yield\s*>)/gi,Le={tr:"tbody",th:"tr",td:"tr",col:"colgroup"},Ie=S&&S<10?/^(?:t(?:body|head|foot|[rhd])|caption|col(?:group)?|opt(?:ion|group))$/:/^(?:t(?:body|head|foot|[rhd])|caption|col(?:group)?)$/,Re="div",Me="svg";function Pe(t,n,r){var i=t&&t.match(/^\s*<([-\w]+)/),o=i&&i[1].toLowerCase(),s=k(r?Me:Re);return t=function(e,t){if(!je.test(e))return e;var n={};return t=t&&t.replace(ke,function(e,t,r){return n[t]=n[t]||r,""}).trim(),e.replace(Te,function(e,t,r){return n[t]||r||""}).replace(Se,function(e,n){return t||n||""})}(t,n),Ie.test(o)?s=function(t,n,r){var i="o"===r[0],o=i?"select>":"table>";if(t.innerHTML="<"+o+n.trim()+"</"+o,o=t.firstChild,i)o.selectedIndex=-1;else{var s=Le[r];s&&1===o.childElementCount&&(o=e(s,o))}return o}(s,t,o):Y(s,t,r),s}function $e(e){for(var t=e;t.__.isAnonymous&&t.parent;)t=t.parent;return t}function Fe(e,t,n,r){var i,o=function(e,t,n){var r=this.__.parent,i=this.__.item;if(!i)for(;r&&!i;)i=r.__.item,r=r.__.parent;if(q(n,"currentTarget")&&(n.currentTarget=e),q(n,"target")&&(n.target=n.srcElement),q(n,"which")&&(n.which=n.charCode||n.keyCode),n.item=i,t.call(this,n),G.autoUpdate&&!n.preventUpdate){var o=$e(this);o.isMounted&&o.update()}}.bind(r,n,t);n[e]=null,i=e.replace(N,""),me(r.__.listeners,n)||r.__.listeners.push(n),n[g]||(n[g]={}),n[g][e]&&n.removeEventListener(i,n[g][e]),n[g][e]=o,n.addEventListener(i,o,!1)}function ze(e,t,n,r){var i=vt(e,t,n),o=t.tagName||Ee(t.root,!0),s=$e(r);return be(i,"parent",s),i.__.parent=r,Oe(s.tags,o,i),s!==r&&Oe(r.tags,o,i),i}function He(e,t,n,r){if(pe(e[t])){var i=e[t].indexOf(n);-1!==i&&e[t].splice(i,1),e[t].length?1!==e[t].length||r||(e[t]=e[t][0]):delete e[t]}else e[t]===n&&delete e[t]}function Ue(e,t){var n,r,i=W(),o=W(),s=te();for(this.root.insertBefore(i,this.root.firstChild),this.root.appendChild(o),this.__.head=r=i,this.__.tail=o;r;)n=r.nextSibling,s.appendChild(r),this.__.virts.push(r),r=n;t?e.insertBefore(s,t.__.head):e.appendChild(s)}function Ve(e,t){var n=te();Ue.call(e,n),t.parentNode.replaceChild(n,t)}function Be(e){if(!this.root||!Q(this.root,"virtualized")){var t,n,r=e.dom,o=(t=e.attr)?(t=t.replace(a,""),C[t]&&(t=C[t]),t):null,s=me([d,h],o),u=e.root&&"VIRTUAL"===e.root.tagName,l=this.__.isAnonymous,c=r&&(e.parent||r.parentNode),p="style"===o,f="class"===o;if(e._riot_id)e.__.wasCreated?e.update():(e.mount(),u&&Ve(e,e.root));else{if(e.update)return e.update();var m,g,v,x,y,b,w,_=s&&!l?Ce.call(this):this,A=!ae(n=H(e.expr,_)),O=le(n);if(O&&(f?n=H(JSON.stringify(n),this):p&&(n=re(n))),!e.attr||e.wasParsedOnce&&A&&!1!==n||X(r,Q(r,e.attr)?e.attr:o),e.bool&&(n=!!n&&o),e.isRtag)return g=this,v=n,y=(m=e).tag||m.dom._tag,b=(y?y.__:{}).head,w="VIRTUAL"===m.dom.tagName,void(y&&m.tagName===v?y.update():(y&&(w&&(x=W(),b.parentNode.insertBefore(x,b)),y.unmount(!0)),de(v)&&(m.impl=i[v],m.impl&&(m.tag=y=ze(m.impl,{root:m.dom,parent:g,tagName:v},m.dom.innerHTML,g),ge(m.attrs,function(e){return T(y.root,e.name,e.value)}),m.tagName=v,y.mount(),w&&Ve(y,x||y.root),g.__.onUnmount=function(){var e=y.opts.dataIs;He(y.parent.tags,e,y),He(y.__.parent.tags,e,y),y.unmount()}))));if((!e.wasParsedOnce||e.value!==n)&&(e.value=n,e.wasParsedOnce=!0,!O||f||p||s)){if(A||(n=""),!o)return n+="",void(c&&(e.parent=c,"TEXTAREA"===c.tagName?(c.value=n,S||(r.nodeValue=n)):r.nodeValue=n));ue(n)?Fe(o,n,r,this):s?J(r,o===h?!n:n):(e.bool&&(r[o]=n),"value"===o&&r.value!==n?r.value=n:A&&!1!==n&&T(r,o,n),p&&r.hidden&&J(r,!1))}}}}function qe(e){ge(e,Be.bind(this))}function De(e,t,n,r,i){if(!e||!n){var o=e?Ce.call(this):t||this;ge(i,function(e){e.expr&&Be.call(o,e.expr),r[we(e.name).replace(a,"")]=e.expr?e.expr.value:e.value})}}function Ze(e){if(!e){var t=Object.keys(i);return t+Ze(t)}return e.filter(function(e){return!/[^-\w]/.test(e)}).reduce(function(e,t){var n=t.trim().toLowerCase();return e+",["+l+'="'+n+'"]'},"")}function Ge(e,t){var n=this,r=n.name,o=n.tmpl,s=n.css,a=n.attrs,u=n.onCreate;return i[r]||(Ke(r,o,s,a,u),i[r].class=this.constructor),xt(e,r,t,this),s&&$.inject(),this}function Ke(e,t,n,r,o){return ue(r)&&(o=r,/^[\w-]+\s?=/.test(n)?(r=n,n=""):r=""),n&&(ue(n)?o=n:$.add(n)),e=e.toLowerCase(),i[e]={name:e,tmpl:t,attrs:r,fn:o},e}function We(e,t,n,r,o){return n&&$.add(n,e),i[e]={name:e,tmpl:t,attrs:r,fn:o},e}function Je(e,t,n){var r,i,o=[];if($.inject(),le(t)&&(n=t,t=0),r=de(e)?(e="*"===e?i=Ze():e+Ze(e.split(/, */)))?K(e):[]:e,"*"===t){if(t=i||Ze(),r.tagName)r=K(t,r);else{var s=[];ge(r,function(e){return s.push(K(t,e))}),r=s}t=0}return function e(r){if(r.tagName){var i,s=Q(r,l);t&&s!==t&&(s=t,T(r,l,t)),(i=xt(r,s||r.tagName.toLowerCase(),n))&&o.push(i)}else r.length&&ge(r,e)}(r),o}var Qe={},Xe=Qe[s]={},Ye=0;function et(e,t,n){if(le(e))et("__"+Ye+++"__",e,!0);else{var r=n?Xe:Qe;if(!t){if(B(r[e]))throw new Error("Unregistered mixin: "+e);return r[e]}r[e]=ue(t)?D(t.prototype,r[e]||{})&&t:D(r[e]||{},t)}}function tt(){return ge(r,function(e){return e.update()})}function nt(e){i[e]=null}var rt=Object.freeze({Tag:Ge,tag:Ke,tag2:We,mount:Je,mixin:et,update:tt,unregister:nt,version:"v3.9.0"});function it(e,t){var n,r=this.parent;r&&(pe(n=r.tags[e])?n.splice(t,0,n.splice(n.indexOf(this),1)[0]):Oe(r.tags,e,this))}function ot(e,t){for(var n,r=this.__.head,i=te();r;)if(n=r.nextSibling,i.appendChild(r),(r=n)===this.__.tail){i.appendChild(r),e.insertBefore(i,t.__.head);break}}function st(e,t,n,r){var i=r?Z(r):{};return i[e.key]=t,e.pos&&(i[e.pos]=n),i}function at(e,t){e.splice(t,1),this.unmount(),He(this.parent,this,this.__.tagName,!0)}function ut(e,t,n){var r,o=typeof Q(e,f)!==v||X(e,f),s=Q(e,m),a=!!s&&H.hasExpr(s),u=Ee(e),l=i[u],d=e.parentNode,h=W(),g=Ne(e),y=Q(e,c),b=[],w=e.innerHTML,_=!i[u],A="VIRTUAL"===e.tagName,O=[];return X(e,p),X(e,m),(n=H.loopKeys(n)).isLoop=!0,y&&X(e,c),d.insertBefore(h,e),d.removeChild(e),n.update=function(){n.value=H(n.val,t);var i=n.value,c=te(),p=!pe(i)&&!de(i),f=h.parentNode,d=[];f&&(p?i=(r=i||!1)?Object.keys(i).map(function(e){return st(n,i[e],e)}):[]:r=!1,y&&(i=i.filter(function(e,r){return n.key&&!p?!!H(y,st(n,e,r,t)):!!H(y,D(Z(t),e))})),ge(i,function(p,h){var m,v,y,N,E=!r&&n.key?st(n,p,h):p,C=(v=p,y=E,N=a,(m=s)?N?H(m,y):v[m]:v),j=o&&typeof p===x&&!r,S=O.indexOf(C),k=-1===S,T=!k&&j?S:h,L=b[T],I=h>=O.length,R=j&&k||!j&&!L;R?((L=vt(l,{parent:t,isLoop:!0,isAnonymous:_,tagName:u,root:e.cloneNode(_),item:E,index:h},w)).mount(),I?function(e,t){t?Ue.call(this,e):e.appendChild(this.root)}.apply(L,[c||f,A]):function(e,t,n){n?Ue.apply(this,[e,t]):ne(e,this.root,t.root)}.apply(L,[f,b[h],A]),I||O.splice(h,0,E),b.splice(h,0,L),g&&Oe(t.tags,u,L,!0)):T!==h&&j&&((s||me(i,O[T]))&&(function(e,t,n){n?ot.apply(this,[e,t]):ne(e,this.root,t.root)}.apply(L,[f,b[h],A]),b.splice(h,0,b.splice(T,1)[0]),O.splice(h,0,O.splice(T,1)[0])),n.pos&&(L[n.pos]=h),!g&&L.tags&&function(e){var t=this;ge(Object.keys(this.tags),function(n){it.apply(t.tags[n],[n,e])})}.call(L,h)),D(L.__,{item:E,index:h,parent:t}),d[h]=C,R||L.update(E)}),function(e,t){for(var n=t.length,r=e.length;n>r;)n--,at.apply(t[n],[t,n])}(i,b),O=d.slice(),f.insertBefore(c,h))},n.unmount=function(){ge(b,function(e){e.unmount()})},n}var lt={init:function(e,t,n,r){return this.dom=e,this.attr=n,this.rawValue=r,this.parent=t,this.hasExp=H.hasExpr(r),this},update:function(){var e=this.value,t=this.parent&&$e(this.parent),n=this.dom.__ref||this.tag||this.dom;this.value=this.hasExp?H(this.rawValue,this.parent):this.rawValue,!ae(e)&&t&&He(t.refs,e,n),!ae(this.value)&&de(this.value)?(t&&Oe(t.refs,this.value,n,null,this.parent.__.index),this.value!==e&&T(this.dom,this.attr,this.value)):X(this.dom,this.attr),this.dom.__ref||(this.dom.__ref=n)},unmount:function(){var e=this.tag||this.dom,t=this.parent&&$e(this.parent);!ae(this.value)&&t&&He(t.refs,this.value,e)}};function ct(e,t,n,r){return Z(lt).init(e,t,n,r)}function pt(e){ge(e,function(e){e.unmount?e.unmount(!0):e.tagName?e.tag.unmount(!0):e.unmount&&e.unmount()})}var ft={init:function(e,t,n){X(e,c),D(this,{tag:t,expr:n,stub:W(),pristine:e});var r=e.parentNode;return r.insertBefore(this.stub,e),r.removeChild(e),this},update:function(){this.value=H(this.expr,this.tag),this.value&&!this.current?(this.current=this.pristine.cloneNode(!0),this.stub.parentNode.insertBefore(this.current,this.stub),this.expressions=ht.apply(this.tag,[this.current,!0])):!this.value&&this.current&&(pt(this.expressions),this.current._tag?this.current._tag.unmount():this.current.parentNode&&this.current.parentNode.removeChild(this.current),this.current=null,this.expressions=[]),this.value&&qe.call(this.tag,this.expressions)},unmount:function(){pt(this.expressions||[])}};function dt(e,t,n){return Z(ft).init(e,t,n)}function ht(e,t){var n=this,r=[];return ie(e,function(i){var o,s,a=i.nodeType;if((t||i!==e)&&(3===a&&"STYLE"!==i.parentNode.tagName&&H.hasExpr(i.nodeValue)&&r.push({dom:i,expr:i.nodeValue}),1===a)){var u="VIRTUAL"===i.tagName;if(o=Q(i,p))return u&&T(i,"loopVirtual",!0),r.push(ut(i,n,o)),!1;if(o=Q(i,c))return r.push(dt(i,n,o)),!1;if((o=Q(i,l))&&H.hasExpr(o))return r.push({isRtag:!0,expr:o,dom:i,attrs:[].slice.call(i.attributes)}),!1;if(s=Ne(i),u&&(Q(i,"virtualized")&&i.parentElement.removeChild(i),s||Q(i,"virtualized")||Q(i,"loopVirtual")||(s={tmpl:i.outerHTML})),s&&(i!==e||t)){if(!u)return r.push(ze(s,{root:i,parent:n},i.innerHTML,n)),!1;Q(i,l)&&_e("Virtual tags shouldn't be used together with the \""+l+'" attribute - https://github.com/riot/riot/issues/2511'),T(i,"virtualized",!0);var f=vt({tmpl:i.outerHTML},{root:i,parent:n},i.innerHTML);r.push(f)}mt.apply(n,[i,i.attributes,function(e,t){t&&r.push(t)}])}}),r}function mt(e,t,n){var r=this;ge(t,function(t){if(!t)return!1;var i,s=t.name,a=fe(s);me(u,s)&&e.tagName.toLowerCase()!==o?i=ct(e,r,s,t.value):H.hasExpr(t.value)&&(i={dom:e,expr:t.value,attr:s,bool:a}),n(t,i)})}function gt(e){var t=this.__.isAnonymous;be(this,"isMounted",e),t||(e?this.trigger("mount"):(this.trigger("unmount"),this.off("*"),this.__.wasCreated=!1))}function vt(e,t,n){void 0===e&&(e={}),void 0===t&&(t={});var i,o=t.context||{},u=D({},t.opts),l=t.parent,c=t.isLoop,p=!!t.isAnonymous,f=G.skipAnonymousTags&&p,d=t.item,h=t.index,m=[],v=t.root,x=t.tagName||Ee(v),y="virtual"===x,b=!y&&!e.tmpl;return f||U(o),e.name&&v._tag&&v._tag.unmount(!0),be(o,"isMounted",!1),be(o,"__",{impl:e,root:v,skipAnonymous:f,implAttrs:[],isAnonymous:p,instAttrs:[],innerHTML:n,tagName:x,index:h,isLoop:c,isInline:b,item:d,parent:l,listeners:[],virts:[],wasCreated:!1,tail:null,head:null}),be(o,"_riot_id",ye()),be(o,"root",v),D(o,{opts:u},d),be(o,"parent",l||null),be(o,"tags",{}),be(o,"refs",{}),b||c&&p?i=v:(y||(v.innerHTML=""),i=Pe(e.tmpl,n,ce(v))),be(o,"update",function(e){return n=e,r=m,i=(t=o).__,s={},a=t.isMounted&&!i.skipAnonymous,i.isAnonymous&&i.parent&&D(t,i.parent),D(t,n),De.apply(t,[i.isLoop,i.parent,i.isAnonymous,s,i.instAttrs]),a&&t.isMounted&&ue(t.shouldUpdate)&&!t.shouldUpdate(n,s)?t:(D(t.opts,s),a&&t.trigger("update",n),qe.call(t,r),a&&t.trigger("updated"),t);var t,n,r,i,s,a}),be(o,"mixin",function(){for(var e=[],t=arguments.length;t--;)e[t]=arguments[t];return function(e){for(var t=[],n=arguments.length-1;n-- >0;)t[n]=arguments[n+1];return ge(t,function(t){var n,r,i=[],o=["init","__proto__"];t=de(t)?et(t):t,n=ue(t)?new t:t;for(var s=Object.getPrototypeOf(n);i=i.concat(Object.getOwnPropertyNames(r||n)),r=Object.getPrototypeOf(r||n););ge(i,function(t){if(!me(o,t)){var r=V(n,t)||V(s,t),i=r&&(r.get||r.set);!e.hasOwnProperty(t)&&i?Object.defineProperty(e,t,r):e[t]=ue(n[t])?n[t].bind(e):n[t]}}),n.init&&n.init.bind(e)(e.opts)}),e}.apply(void 0,[o].concat(e))}),be(o,"mount",function(){return function(e,t,n,r){var i=e.__,o=i.root;o._tag=e,mt.apply(i.parent,[o,o.attributes,function(t,n){!i.isAnonymous&&lt.isPrototypeOf(n)&&(n.tag=e),t.expr=n,i.instAttrs.push(t)}]),ee(i.impl.attrs,function(e,t){i.implAttrs.push({name:e,value:t})}),mt.apply(e,[o,i.implAttrs,function(e,t){t?n.push(t):T(o,e.name,e.value)}]),De.apply(e,[i.isLoop,i.parent,i.isAnonymous,r,i.instAttrs]);var a=et(s);if(a&&!i.skipAnonymous)for(var u in a)a.hasOwnProperty(u)&&e.mixin(a[u]);if(i.impl.fn&&i.impl.fn.call(e,r),i.skipAnonymous||e.trigger("before-mount"),ge(ht.apply(e,[t,i.isAnonymous]),function(e){return n.push(e)}),e.update(i.item),!i.isAnonymous&&!i.isInline)for(;t.firstChild;)o.appendChild(t.firstChild);if(be(e,"root",o),!i.skipAnonymous&&e.parent){var l=$e(e.parent);l.one(l.isMounted?"updated":"mount",function(){gt.call(e,!0)})}else gt.call(e,!0);return e.__.wasCreated=!0,e}(o,i,m,u)}),be(o,"unmount",function(e){return function(e,t,n){var i=e.__,o=i.root,s=r.indexOf(e),u=o.parentNode;if(i.skipAnonymous||e.trigger("before-unmount"),ee(i.impl.attrs,function(e){ve(e,a)&&(e=e.slice(a.length)),X(o,e)}),e.__.listeners.forEach(function(e){Object.keys(e[g]).forEach(function(t){e.removeEventListener(t,e[g][t])})}),-1!==s&&r.splice(s,1),i.parent&&!i.isAnonymous){var l=$e(i.parent);i.isVirtual?Object.keys(e.tags).forEach(function(t){return He(l.tags,t,e.tags[t])}):He(l.tags,i.tagName,e)}return e.__.virts&&ge(e.__.virts,function(e){e.parentNode&&e.parentNode.removeChild(e)}),pt(n),ge(i.instAttrs,function(e){return e.expr&&e.expr.unmount&&e.expr.unmount()}),t?Y(o,""):u&&u.removeChild(o),i.onUnmount&&i.onUnmount(),e.isMounted||gt.call(e,!0),gt.call(e,!1),delete o._tag,e}(o,e,m)}),o}function xt(e,t,n,o){var s,a=i[t],u=i[t].class,l=o||(u?Z(u.prototype):{}),c=e._innerHTML=e._innerHTML||e.innerHTML,p=D({root:e,opts:n,context:l},{parent:n?n.parent:null});return a&&e&&(s=vt(a,p,c)),s&&s.mount&&(s.mount(!0),me(r,s)||r.push(s)),s}var yt=Object.freeze({arrayishAdd:Oe,getTagName:Ee,inheritParentProps:Ce,mountTo:xt,selectTags:Ze,arrayishRemove:He,getTag:Ne,initChildTag:ze,moveChildTag:it,makeReplaceVirtual:Ve,getImmediateCustomParentTag:$e,makeVirtual:Ue,moveVirtual:ot,unmountAll:pt,createIfDirective:dt,createRefDirective:ct}),bt=G,wt={tmpl:H,brackets:z,styleManager:$,vdom:r,styleNode:$.styleNode,dom:oe,check:he,misc:Ae,tags:yt},_t=Ge,At=Ke,Ot=We,Nt=Je,Et=et,Ct=tt,jt=nt,St=U,kt=D({},rt,{observable:U,settings:bt,util:wt}),Tt=Object.freeze({settings:bt,util:wt,Tag:_t,tag:At,tag2:Ot,mount:Nt,mixin:Et,update:Ct,unregister:jt,version:"v3.9.0",observable:St,default:kt});function Lt(e){var t=arguments,n=e.source,r=e.global?"g":"";e.ignoreCase&&(r+="i"),e.multiline&&(r+="m");for(var i=1;i<arguments.length;i++)n=n.replace("@","\\"+t[i]);return new RegExp(n,r)}var It=function(e){var t={};function n(t){var n=e[t];if(n)return n;throw new Error('Parser "'+t+'" not loaded.')}function r(e,t){if(t)for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);return e}function i(e,t,i,o){return i=r({pretty:!0,filename:o,doctype:"html"},i),n(e).render(t,i)}return t.html={jade:function(e,t,n){return console.log('DEPRECATION WARNING: jade was renamed "pug" - The jade parser will be removed in riot@3.0.0!'),i("jade",e,t,n)},pug:function(e,t,n){return i("pug",e,t,n)}},t.css={less:function(e,t,i,o){var s;return i=r({sync:!0,syncImport:!0,filename:o},i),n("less").render(t,i,function(e,t){if(e)throw e;s=t.css}),s}},t.js={es6:function(e,t,i){return n("Babel").transform(e,r({plugins:[["transform-es2015-template-literals",{loose:!0}],"transform-es2015-literals","transform-es2015-function-name","transform-es2015-arrow-functions","transform-es2015-block-scoped-functions",["transform-es2015-classes",{loose:!0}],"transform-es2015-object-super","transform-es2015-shorthand-properties","transform-es2015-duplicate-keys",["transform-es2015-computed-properties",{loose:!0}],["transform-es2015-for-of",{loose:!0}],"transform-es2015-sticky-regex","transform-es2015-unicode-regex","check-es2015-constants",["transform-es2015-spread",{loose:!0}],"transform-es2015-parameters",["transform-es2015-destructuring",{loose:!0}],"transform-es2015-block-scoping","transform-es2015-typeof-symbol",["transform-es2015-modules-commonjs",{allowTopLevelThis:!0}],["transform-regenerator",{async:!1,asyncGenerators:!1}]]},t)).code},buble:function(e,t,i){return t=r({source:i,modules:!1},t),n("buble").transform(e,t).code},coffee:function(e,t){return n("CoffeeScript").compile(e,r({bare:!0},t))},livescript:function(e,t){return n("livescript").compile(e,r({bare:!0,header:!1},t))},typescript:function(e,t){return n("typescript")(e,t)},none:function(e){return e}},t.js.javascript=t.js.none,t.js.coffeescript=t.js.coffee,t._req=function(e){var n=e.split(".");if(2!==n.length)throw new Error("Bad format for parsers._req");var r=t[n[0]][n[1]];if(r)return r;throw new Error('Parser "'+e+'" not found.')},t.utils={extend:r},t}(window||global),Rt=/'[^'\n\r\\]*(?:\\(?:\r\n?|[\S\s])[^'\n\r\\]*)*'/.source,Mt=[/\/\*[^*]*\*+(?:[^*/][^*]*\*+)*\//.source,"//.*",Rt,Rt.replace(/'/g,'"'),"([/`])"].join("|"),Pt=Mt.slice(0,-2)+"{}])";function $t(e,t,n){var r=/[`$\\]/g;for(r.lastIndex=t;r.exec(e);){var i=r.lastIndex,o=e[i-1];if("`"===o)return i;if("$"===o&&"{"===e[i])return n.push("`","}"),i+1;r.lastIndex++}throw new Error("Unclosed ES6 template")}var Ft=It.utils.extend,zt=/"[^"\n\\]*(?:\\[\S\s][^"\n\\]*)*"|'[^'\n\\]*(?:\\[\S\s][^'\n\\]*)*'/.source,Ht=z.R_STRINGS.source,Ut=/ *([-\w:\xA0-\xFF]+) ?(?:= ?('[^']*'|"[^"]*"|\S+))?/g,Vt=RegExp(/<!--(?!>)[\S\s]*?-->/.source+"|"+zt,"g"),Bt=/<(-?[A-Za-z][-\w\xA0-\xFF]*)(?:\s+([^"'/>]*(?:(?:"[^"]*"|'[^']*'|\/[^>])[^'"/>]*)*)|\s*)(\/?)>/g,qt=/>[ \t]+<(-?[A-Za-z]|\/[-A-Za-z])/g,Dt=["style","src","d","value"],Zt=/^(?:input|img|br|wbr|hr|area|base|col|embed|keygen|link|meta|param|source|track)$/,Gt=/<pre(?:\s+(?:[^">]*|"[^"]*")*)?>([\S\s]+?)<\/pre\s*>/gi,Kt=/^"(?:number|date(?:time)?|time|month|email|color)\b/i,Wt=/^\s*import(?!\w)(?:(?:\s|[^\s'"])*)['|"].*\n?/gm,Jt=/[ \t]+$/gm,Qt=Lt(/@#\d/,"x01"),Xt=Lt(/@#(\d+)/g,"x01"),Yt="#",en="⁗",tn='"',nn="'";function rn(e){var t,n=Vt;for(1!==e.indexOf("\r")&&(e=e.replace(/\r\n?/g,"\n")),n.lastIndex=0;t=n.exec(e);)"<"===t[0][0]&&(e=RegExp.leftContext+RegExp.rightContext,n.lastIndex=t[3]+1);return e}function on(e,t){var n,r,i,o=[];for(Ut.lastIndex=0,e=e.replace(/\s+/g," ");n=Ut.exec(e);){var s=n[1].toLowerCase(),a=n[2];a?(a[0]!==tn&&(a=tn+(a[0]===nn?a.slice(1,-1):a)+tn),"type"===s&&Kt.test(a)?r=a:(Qt.test(a)&&("value"===s&&(i=1),-1!==Dt.indexOf(s)&&(s="riot-"+s)),o.push(s+"="+a))):o.push(s)}return r&&(i&&(r=tn+t._bp[0]+nn+r.slice(1,-1)+nn+t._bp[1]+tn),o.push("type="+r)),o.join(" ")}function sn(e,t,n){var r=n._bp;if(e&&r[4].test(e)){for(var i,o=t.expr&&(t.parser||t.type)?pn:0,s=z.split(e,0,r),a=1;a<s.length;a+=2)"^"===(i=s[a])[0]?i=i.slice(1):o&&";"===(i=o(i,t).trim()).slice(-1)&&(i=i.slice(0,-1)),s[a]=Yt+(n.push(i)-1)+r[1];e=s.join("")}return e}function an(e,t){return t.length&&(e=e.replace(Xt,function(e,n){return t._bp[0]+t[n].trim().replace(/[\r\n]+/g," ").replace(/"/g,en)})),e}function un(e,t,n){if(!/\S/.test(e))return"";if(e=sn(e,t,n).replace(Bt,function(e,t,r,i){return t=t.toLowerCase(),i=i&&!Zt.test(t)?"></"+t:"",r&&(t+=" "+on(r,n)),"<"+t+i+">"}),!t.whitespace){var r=[];/<pre[\s>]/.test(e)&&(e=e.replace(Gt,function(e){return r.push(e),""})),e=e.trim().replace(/\s+/g," "),r.length&&(e=e.replace(/\u0002/g,function(){return r.shift()}))}return t.compact&&(e=e.replace(qt,"><$1")),an(e,n).replace(Jt,"")}var ln=/^[ \t]*(((?:async|\*)\s*)?([$_A-Za-z][$\w]*))\s*\([^()]*\)\s*{/m;function cn(e){var t,n,r,i,o,s,a=[],u=RegExp,l=function(e,t){for(var n,r,i,o,s,a,u=new RegExp(Mt,"g"),l=z.skipRegex,c=0|t,p=[[]],f=[],d=u,h=d.lastIndex=c;a=d.exec(e);){if(o=a.index,s=d.lastIndex,r="",i=a[1]){if("{"===i)f.push("}");else if("}"===i){if(f.pop()!==i)throw new Error("Unexpected '}'");"`"===f[f.length-1]&&(i=f.pop())}else"/"===i&&(s=l(e,o))>o+1&&(r=e.slice(o,s));"`"===i&&(s=$t(e,s,f),r=e.slice(o,s),d=f.length?n||(n=new RegExp(Pt,"g")):u)}else"/"===(r=a[0])[0]?(r="*"===r[1]?" ":"",e=e.slice(c,o)+r+e.slice(s),s=o+r.length,r=""):2===r.length&&(r="");r&&(p[0].push(e.slice(h,o)),p.push(r),h=s),d.lastIndex=s}return p[0].push(e.slice(h)),p}(e);for(e=l.shift().join("<%>");t=e.match(ln);)a.push(u.leftContext),r=c(e=u.rightContext),i=t[1],o=t[2]||"",s=t[3],s=(n=!/^(?:if|while|for|switch|catch|function)$/.test(s))?t[0].replace(i,"this."+s+" ="+o+" function"):t[0],a.push(s,e.slice(0,r)),e=e.slice(r),n&&!/^\s*.\s*bind\b/.test(e)&&a.push(".bind(this)");return a.length&&(e=a.join("")+e),l.length&&(e=e.replace(/<%>/g,function(){return l.shift()})),e;function c(e){for(var t=/[{}]/g,n=1;n&&t.exec(e);)"{"===e[t.lastIndex-1]?++n:--n;return n?e.length:t.lastIndex}}function pn(e,t,n,r,i){return/\S/.test(e)?(n||(n=t.type),(t.parser||n&&It._req("js."+n,!0)||cn)(e,r,i).replace(/\r\n?/g,"\n").replace(Jt,"")):""}var fn=RegExp("([{}]|^)[; ]*((?:[^@ ;{}][^{}]*)?[^@ ;{}:] ?)(?={)|"+zt,"g");function dn(e,t,n,r){var i,o;(r=r||{},n)&&("css"!==n&&(e=It._req("css."+n,!0)(t,e,r.parserOpts||{},r.url)));return e=e.replace(z.R_MLCOMMS,"").replace(/\s+/g," ").trim(),t&&(i=t,o=":scope",e=e.replace(fn,function(e,t,n){return n?(n=n.replace(/[^,]+/g,function(e){var t=e.trim();return 0===t.indexOf(i)?e:t&&"from"!==t&&"to"!==t&&"%"!==t.slice(-1)?t=t.indexOf(o)<0?i+" "+t+',[data-is="'+i+'"] '+t:t.replace(o,i)+","+t.replace(o,'[data-is="'+i+'"]'):e}),t?t+" "+n:n):e})),e}var hn=/\stype\s*=\s*(?:(['"])(.+?)\1|(\S+))/i,mn="\\s*=\\s*("+Ht+"|{[^}]+}|\\S+)",gn=/\/>\n|^<(?:\/?-?[A-Za-z][-\w\xA0-\xFF]*\s*|-?[A-Za-z][-\w\xA0-\xFF]*\s+[-\w:\xA0-\xFF][\S\s]*?)>\n/;function vn(e,t){return e?(e=nn+e.replace(/\\/g,"\\\\").replace(/'/g,"\\'")+nn,t&&-1!==e.indexOf("\n")?e.replace(/\n/g,"\\n"):e):"''"}function xn(e){if(e){var t=e.match(hn);if(t=t&&(t[2]||t[3]))return t.replace("text/","")}return""}function yn(e,t){if(e){var n=e.match(RegExp("\\s"+t+mn,"i"));if(n=n&&n[1])return/^['"]/.test(n)?n.slice(1,-1):n}return""}function bn(e){var t=yn(e,"options").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#039;/g,"'");return t?JSON.parse(t):null}var wn=RegExp(/^([ \t]*)<(-?[A-Za-z][-\w\xA0-\xFF]*)(?:\s+([^'"/>]+(?:(?:@|\/[^>])[^'"/>]*)*)|\s*)?(?:\/>|>[ \t]*\n?([\S\s]*)^\1<\/\2\s*>|>(.*)<\/\2\s*>)/.source.replace("@",Ht),"gim"),_n=/<script(\s+[^>]*)?>\n?([\S\s]*?)<\/script\s*>/gi,An=/<style(\s+[^>]*)?>\n?([\S\s]*?)<\/style\s*>/gi;var On,Nn,En={compile:function(e,t,n){var r,i=[],o=e;t||(t={}),t.parserOptions=Ft({template:{},js:{},style:{}},t.parserOptions||{}),r=t.exclude?function(e){return t.exclude.indexOf(e)<0}:function(){return 1},n||(n="");var s,a,u,l,c=z.array(t.brackets);return t.template&&(s=o,a=n,u=t.template,l=t.parserOptions.template,o=It._req("html."+u,!0)(s,l,a)),o=rn(o).replace(wn,function(e,o,s,a,u,l){var p,f,d,h,m,g,v,x,y="",b="",w="",_="",A=[];if(A._bp=c,s=s.toLowerCase(),a=a&&r("attribs")?an(on(sn(a,t,A),A),A):"",(u||(u=l))&&/\S/.test(u))if(l)r("html")&&(w=un(l,t,A));else{var O=function(e){if(/<[-\w]/.test(e))for(var t,n=e.lastIndexOf("<"),r=e.length;-1!==n;){if(t=e.slice(n,r).match(gn))return n+=t.index+t[0].length,"<-/>\n"===(t=e.slice(0,n)).slice(-5)&&(t=t.slice(0,-5)),[t,e.slice(n)];r=n,n=e.lastIndexOf("<",n-1)}return["",e]}((u=(u=(u=u.replace(RegExp("^"+o,"gm"),"")).replace(_n,function(e,i,o){if(r("js")){var s=(a=o,u=t,c=n,p=xn(l=i),f=yn(l,"src"),d=Ft({},u.parserOptions.js),!f&&pn(a,u,p,Ft(d,bn(l)),c));s&&(y+=(y?"\n":"")+s)}var a,u,l,c,p,f,d;return""})).replace(An,function(e,i,o){var a,u,l,c,p,f,d;return r("css")&&(b+=(b?" ":"")+(a=o,l=i,c=n,p=s,f=Ft({},(u=t).parserOptions.style),d={parserOpts:Ft(f,bn(l)),url:c},dn(a,p,xn(l)||u.style,d))),""})).replace(Jt,""));r("html")&&(w=un(O[0],t,A)),r("js")&&((u=pn(O[1],t,null,null,n))&&(y+=(y?"\n":"")+u),y=y.replace(Wt,function(e){return _+=e.trim()+"\n",""}))}return y=/\S/.test(y)?y.replace(/\n{3,}/g,"\n\n"):"",t.entities?(i.push({tagName:s,html:w,css:b,attribs:a,js:y,imports:_}),""):(p=s,f=w,d=b,h=a,m=y,g=_,v=t.debug?",\n  ":", ",x="});",m&&"\n"!==m.slice(-1)&&(x="\n"+x),g+"riot.tag2('"+p+nn+v+vn(f,1)+v+vn(d)+v+vn(h)+", function(opts) {\n"+m+x)}),t.entities?i:o},compileHTML:function(e,t,n){return Array.isArray(t)?(n=t,t={}):(n||(n=[]),t||(t={})),n._bp=z.array(t.brackets),un(rn(e),t,n)},compileCSS:function(e,t,n){return t&&"object"==typeof t?(n=t,t=""):n||(n={}),dn(e,n.tagName,t,n)},compileJS:function(e,t,n,r){return"string"==typeof t&&(r=n,n=t,t={}),n&&"object"==typeof n&&(r=n,n=""),r||(r={}),pn(e,t||{},n,r.parserOptions,r.url)},parsers:It,version:"v3.4.0"};function Cn(e,t,n){var r=new XMLHttpRequest;r.onreadystatechange=function(){4===r.readyState&&(200===r.status||!r.status&&r.responseText.length?t(r.responseText,n,e):kn.error('"'+e+'" not found'))},r.onerror=function(e){return kn.error(e)},r.open("GET",e,!0),r.send("")}function jn(e,t){if(typeof e===v){var n=k("script"),r=document.documentElement;t&&(e+="\n//# sourceURL="+t+".js"),n.text=e,r.appendChild(n),r.removeChild(n)}}var Sn=En.parsers;function kn(e,t,n){if(typeof e===v){if(le(t)&&(n=t,t=!1),/^\s*</m.test(e)){var r=En.compile(e,n);return!0!==t&&jn(r),ue(t)&&t(r,e,n),r}Cn(e,function(e,n,r){var i=En.compile(e,n,r);jn(i,r),t&&t(i,e,n)},n)}else if(pe(e)){var i=e.length;e.forEach(function(e){Cn(e,function(e,n,r){var o=En.compile(e,n,r);jn(o,r),!--i&&t&&t(o,e,n)},n)})}else{if(ue(e)?(n=t,t=e):(n=e,t=void 0),Nn)return t&&t();On?t&&On.on("ready",t):(On=U(),function(e,t){var n=K('script[type="riot/tag"]'),r=n.length;function i(){On.trigger("ready"),Nn=!0,e&&e()}function o(e,t,n){jn(En.compile(e,t,n),n),--r||i()}if(r)for(var s=0;s<n.length;++s){var a=n[s],u=D({template:Q(a,"template")},t),l=Q(a,"src")||Q(a,"data-src");l?Cn(l,o,u):o(a.innerHTML,u)}else i()}(t,n))}}return kn.error=function(e){throw new Error(e)},D({},Tt,{mount:function(){for(var e,t=[],n=arguments.length;n--;)t[n]=arguments[n];return kn(function(){e=Nt.apply(Tt,t)}),e},compile:kn,parsers:Sn})},"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):e.riot=t();