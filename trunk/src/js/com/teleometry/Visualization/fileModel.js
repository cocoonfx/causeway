// checking to see whether file or line should be added
var checkFile = (function () {
    "use strict";

    function FileObject(name) {
        //line object.
        //Holds line number and message send information
        //Keeps an array of nodes corresponding to a message send
        function LineObject(span, message, isgot) {

            this.span = span;
            this.isgot = isgot; //if is a got
            this.message = message;
            this.show = 1;

            this.ycoord = 0;

            this.lnElements = [];

            //adding a node to the line object
            LineObject.prototype.addElementToLine = function (element) {
                this.lnElements.push(element);
            };

        }

        //file name
        this.name = name;
      
        //array of line objects
        this.lines = [];

        //adds line to file
        FileObject.prototype.addLine = function (span, message, element, ifgot) { 

            //creates an instance of the line object
            var i, lobj = new LineObject(span, message, ifgot);
            lobj.addElementToLine(element);

            for (i = 0; i < this.lines.length; i += 1) {

                if (span[0][0] < this.lines[i].span[0][0]) {
                    this.lines.splice(i, 0, lobj);
                    return;
                }
                if (span[0][0] === this.lines[i].span[0][0]) {
                    //put got after sent from same source line
                    if (!ifgot) { 
                        this.lines.splice(i, 0, lobj);
                        return;
                    }
                }
            }
            this.lines.push(lobj);
        };
    }

    function addFile(files, name, span, message, element, ifgot) {
        var fobj = new FileObject(name);
        fobj.addLine(span, message, element, ifgot);
        files.push(fobj);
    }

    return function (files, name, span, message, element, ifgot) {

        var i, j, line;
        for (i = 0; i < files.length; i += 1) {

            if (files[i].name === name) {
                //check for line
                for (j = 0; j < files[i].lines.length; j += 1) {
                    line = files[i].lines[j];
                    if (line.span[0][0] === span[0][0] && line.span[0][1] === span[0][1]) {
                        line.addElementToLine(element);
                        return;
                    }
                }
            
                //line not found, add line to file
                files[i].addLine(span, message, element, ifgot);
                return;
            }
   
        }//for i

        //file was not found, create new file object
        addFile(files, name, span, message, element, ifgot);

    };


}());


