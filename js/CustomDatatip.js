function CustomDatatip(){var datatip=document.createElement("div");var tips=document.querySelectorAll('*[data-tip]');for(var i=0;i<tips.length;i++){tips[i].onmouseover=function(e){datatip.innerHTML=e.target.getAttribute('data-tip');datatip.style.display="inline";var rect=e.target.getBoundingClientRect();if(e.target.tagName=="OPTION"){datatip.style.left=Math.round(rect.right+5)+"px";datatip.style.top=Math.round(rect.top+0)+"px";}
else{datatip.style.left=Math.round(e.clientX+15)+"px";datatip.style.top=Math.round(e.pageY+10)+"px";}}
tips[i].onmouseout=function(e){datatip.style.display="none";}
tips[i].style.cursor="pointer";}
datatip.className='CustomDatatip';document.body.appendChild(datatip);}
