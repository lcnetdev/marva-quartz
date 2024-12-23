
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


  calculateCutter (toCut,howLong) {
    var authorName = toCut
    authorName = authorName.toUpperCase();
    authorName = authorName.replace(/^[0-9]/,"a");
    //replace diacritics with the letter
    authorName = authorName.normalize('NFKD').replace(/[^\w]/g, '');
    authorName = authorName.replace(/[^A-Za-z]/g,"");
    //var authorNameLength = authorName.length;
    authorName = authorName.replace(/^QU/i,"@");
    authorName = authorName.replace(/(^.)CH/i,"$1#");
    var cutter = "";

    for (var i=0; i<authorName.length; i++) {
      if (i == 0) {
        cutter += authorName.slice(0,1); //alert (cutter);
        cutter = cutter.replace(/a/,"A");
        //alert (authorName + " " + cutter);
      }
	  else if (i == 1) {
        var initialLetter = authorName.slice(0,1); //alert (initialLetter);
        var secondLetter = authorName.slice(1,2); //alert (secondLetter);
        if (initialLetter.match(/^A|E|I|O|U$/)) {
          if (secondLetter.match(/^A|B|C$/)) {cutter += "2"}
          if (secondLetter.match(/^D|E|F|G|H$/)) {cutter += "3"}
          if (secondLetter.match(/^I|J|K|L|M$/)) {cutter += "4"}
          if (secondLetter.match(/^N$/)) {cutter += "5"}
          if (secondLetter.match(/^O|P|Q$/)) {cutter += "6"}
          if (secondLetter.match(/^R$/)) {cutter += "7"}
          if (secondLetter.match(/^S|T$/)) {cutter += "8"}
          if (secondLetter.match(/^U|V|W|X|Y|Z$/)) {cutter += "9"}
        }
        else if (initialLetter.match(/^S$/)) {
          if (secondLetter.match(/^A|B|C$/)) {cutter += "2"}
          if (secondLetter == "#") {cutter += "3"}
          if (secondLetter.match(/^D|E|F|G$/)) {cutter += "4"}
          if (secondLetter.match(/^H|I|J|K|L$/)) {cutter += "5"}
          if (secondLetter.match(/^M|N|O|P$/)) {cutter += "6"}
          if (secondLetter.match(/^Q|R|S|T$/)) {cutter += "7"}
          if (secondLetter.match(/^U|V$/)) {cutter += "8"}
          if (secondLetter.match(/^W|X|Y|Z$/)) {cutter += "9"}
        }
        else if (initialLetter.match(/^@$/)) {
          if (secondLetter.match(/^A|B|C|D$/)) {cutter += "3"}
          if (secondLetter.match(/^E|F|G|H$/)) {cutter += "4"}
          if (secondLetter.match(/^I|J|K|L|M|N$/)) {cutter += "5"}
          if (secondLetter.match(/^O|P|Q$/)) {cutter += "6"}
          if (secondLetter.match(/^R|S$/)) {cutter += "7"}
          if (secondLetter.match(/^T|U|V|W$/)) {cutter += "8"}
          if (secondLetter.match(/^Y|Z$/)) {cutter += "9"}
        }
        else if (initialLetter.match(/^Q$/)) {
          cutter += "2";
        }
        else if (initialLetter.match(/^a$/)) {
          cutter += "1"; //alert ("yay")
        }
        else {
          if (secondLetter.match(/^A|B|C|D$/)) {cutter += "3"}
          if (secondLetter.match(/^E|F|G|H$/)) {cutter += "4"}
          if (secondLetter.match(/^I|J|K|L$/)) {cutter += "5"}
          if (secondLetter.match(/^M|N|O$/)) {cutter += "6"}
          if (secondLetter.match(/^P|Q|R|S$/)) {cutter += "7"}
          if (secondLetter.match(/^T|U|V$/)) {cutter += "8"}
          if (secondLetter.match(/^W|X|Y|Z$/)) {cutter += "9"}
        }
      }
      else if (i>1) {
        var iLetter = authorName.slice(i,i+1);
        if (iLetter.match(/^A|B|C|D$/)) {cutter += "3"}
        if (iLetter.match(/^E|F|G|H$/)) {cutter += "4"}
        if (iLetter.match(/^I|J|K|L$/)) {cutter += "5"}
        if (iLetter.match(/^M|N|O$/)) {cutter += "6"}
        if (iLetter.match(/^P|Q|R|S$/)) {cutter += "7"}
        if (iLetter.match(/^T|U|V$/)) {cutter += "8"}
        if (iLetter.match(/^W|X|Y|Z$/)) {cutter += "9"}
      }
    }
    var noofdigits = howLong;
    var cutterLength = cutter.length;
    //alert (noofdigits + " " + cutterLength);
    if (cutterLength-1 > noofdigits) {
        noofdigits+=1;
        //alert (noofdigits);
        cutter = cutter.slice(0,noofdigits);
    }
    return cutter
  }



}


export default utilsMisc;