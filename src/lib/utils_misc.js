
const utilsMisc = {

  globalNav: function(dir,source){


    let allSelectable = document.getElementsByClassName('can-select');
    let foundSource = false

    // convert to array
    allSelectable = [...allSelectable];

    if (dir == 'up'){
      allSelectable = allSelectable.reverse()
    }

    for (let el of allSelectable){

      // we're loop though so if we found it on the last iteration then the n
      if (foundSource){        
        el.focus()
        break
      }


      if (el === source){
        foundSource=true
      }
    }


  },
  
  prettifyXmlJS(xml, tab = '\t', nl = '\n'){
    let formatted = '', indent = '';
    const nodes = xml.slice(1, -1).split(/>\s*</);
    if (nodes[0][0] == '?') formatted += '<' + nodes.shift() + '>' + nl;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node[0] == '/') indent = indent.slice(tab.length); // decrease indent
      formatted += indent + '<' + node + '>' + nl;
      if (node[0] != '/' && node[node.length - 1] != '/' && node.indexOf('</') == -1) indent += tab; // increase indent
    }
    return formatted;
  },



}


export default utilsMisc;