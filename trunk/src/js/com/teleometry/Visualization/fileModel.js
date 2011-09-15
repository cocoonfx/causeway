// checking to see whether file or line should be added
var checkFile = (function () {
    "use strict";

    //line object.
    //Holds line number and message send information
    //Keeps an array of nodes corresponding to a message send
    function LineObject(source, span, message, isgot) {

        this.source = source;
        this.span = span;
        this.message = message;
        this.isgot = isgot; //if is a got
        this.textLen = 0;
        this.show = true;

        this.ycoord = 0;

        this.lnElements = [];

    }

    //adding a node to the line object
    LineObject.prototype.addElementToLine = function (element) {
        this.lnElements.push(element);
    };



    function FileObject(name) {

        //file name
        this.name = name;
        this.ycoord = 0;
        this.show = true;      

        //array of line objects
        this.lines = [];
    }

    //adds line to file
    FileObject.prototype.addLine = function (source, span, message, element, ifgot) {

        //creates an instance of the line object
        var i, lobj = new LineObject(source, span, message, ifgot);
        lobj.addElementToLine(element);

        for (i = 0; i < this.lines.length; i += 1) {

            if (span[0][0] < this.lines[i].span[0][0]) {
                this.lines.splice(i, 0, lobj);
                return;
            }
            if (span[0][0] === this.lines[i].span[0][0]) {
                //put got after sent from same source line
                if (span[0][1] < this.lines[i].span[0][1]) {
                    this.lines.splice(i, 0, lobj);
                    return;
                }
            }
        }
        this.lines.push(lobj);
    };

    function addFile(files, source, span, message, element, ifgot) {
        var fobj = new FileObject(source);
        fobj.addLine(source, span, message, element, ifgot);
        files.push(fobj);
    }

    return function (files, source, span, message, element, ifgot) {
        var i, j, line;
        for (i = 0; i < files.length; i += 1) {

            if (files[i].name === source) {
                //check for line
                for (j = 0; j < files[i].lines.length; j += 1) {
                    line = files[i].lines[j];
                    if (line.span[0][0] === span[0][0] && line.span[0][1] === span[0][1]) {
                        line.addElementToLine(element);
                        return;
                    }
                }
                //line not found, add line to file
                files[i].addLine(source, span, message, element, ifgot);
                return;
            }
        }
        //file was not found, create new file object
        addFile(files, source, span, message, element, ifgot);
    };
}());


