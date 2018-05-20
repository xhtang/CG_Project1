//该函数在一个canvas上绘制一个点
//其中cxt是从canvas中获得的一个2d上下文context
//    x,y分别是该点的横纵坐标
//    color是表示颜色的整形数组，形如[r,g,b]
//    color在这里会本转化为表示颜色的字符串，其内容也可以是：
//        直接用颜色名称:   "red" "green" "blue"
//        十六进制颜色值:   "#EEEEFF"
//        rgb分量表示形式:  "rgb(0-255,0-255,0-255)"
//        rgba分量表示形式:  "rgba(0-255,1-255,1-255,透明度)"
//由于canvas本身没有绘制单个point的接口，所以我们通过绘制一条短路径替代
function drawPoint(cxt,x,y, color) {
    //建立一条新的路径
    cxt.beginPath();
    //设置画笔的颜色
    cxt.strokeStyle ="rgb("+color[0] + "," +
        +color[1] + "," +
        +color[2] + ")" ;
    //设置路径起始位置
    cxt.moveTo(x,y);
    //在路径中添加一个节点
    cxt.lineTo(x+1,y+1);
    //用画笔颜色绘制路径
    cxt.stroke();
}

function drawRedPoint(cxt,x,y) {
    cxt.beginPath();
    cxt.arc(x,y,10,0,2 * Math.PI);
    cxt.fillStyle="red";//填充颜色,默认是红色
    cxt.fill();//画实心圆
    cxt.strokeStyle="black";
    cxt.stroke();
    cxt.closePath();
}

function findPoint(x, y) {
    var flag = -1;
    for (var i = vertex_pos.length - 1;i >= 0;i--) {
        var x1 = vertex_pos[i][0] + 10;
        var y1 = vertex_pos[i][1] + 10;
        var len = Math.pow(x1 - x, 2) + Math.pow(y1 - y, 2);
        if (len < 100)
            flag = i;
    }
    return flag;
}

function drawNinePoints(cxt, points) {
    for (var i = 0;i < points.length;i++) {
        drawRedPoint(cxt,points[i][0],points[i][1]);
    }
}

//绘制线段的函数绘制一条从(x1,y1)到(x2,y2)的线段，cxt和color两个参数意义与绘制点的函数相同，
function drawLine(cxt,x1,y1,x2,y2,color){

    cxt.beginPath();
    cxt.strokeStyle ="rgba("+color[0] + "," +
        +color[1] + "," +
        +color[2] + "," +
        +255 + ")" ;
    //这里线宽取1会有色差，但是类似半透明的效果有利于debug，取2效果较好
    cxt.lineWidth =1;
    cxt.moveTo(x1, y1);
    cxt.lineTo(x2, y2);
    cxt.stroke();
}

function contains(nodes, point) {
    var flag = 0;

    var length = nodes.length;
    if (length > 0) {
        if (nodes[0][0] === point[0] && nodes[0][1] === point[1])
            flag = 1;

        if (nodes[length - 1][0] === point[0] && nodes[length-1][1] === point[1])
            flag = 2;
    }

    return flag;
}

function render(poly,color) {
    //得到要扫描的Y的范围
    var rangeY = getRangeOfY(poly);
    minY = rangeY[0];
    maxY = rangeY[1];

    var nodes = [];
    var p; //交点
    var lengthOfpoly = poly.length;

    //从上到下进行扫描
    for (var y = minY;y <= maxY;y++) {
        //将多边形的每一条边与横向的射线相交，得到交点，并按照X值排序
        for (var i = 0;i < lengthOfpoly;i++) {
            //首先得到两个端点的坐标,
            y1 = poly[i][1];
            x1 = poly[i][0];
            y2 = poly[(i+1)%lengthOfpoly][1];
            x2 = poly[(i+1)%lengthOfpoly][0];
            if (y === y1 && y2 === y) { //当三个y值相同时
                p = [poly[i][0]+1,y];
                nodes.push(p);
            }
            else if (((y >= y1 && y <= y2) || (y <= y1 && y >= y2))) { //当y值在y1和y2的范围内时
                var x = parseInt(((y - y1) * (x2 - x1) / (y2 - y1)) + x1);

                p = [x,y];
                var flag = contains(nodes,p);
                var y3;
                if ( flag === 0)
                    nodes.push(p);
                else if (flag === 1){
                    // 同一点出现两次，说明这个点是图形两边的交点，然后判断这两边的另外两个端点在y值上是否是同一侧，是就记两个交点
                    y3 = poly[(i+2)%lengthOfpoly][1];
                    if ((y3-y2) * (y1 - y2) > 0)
                        nodes.push(p);
                }
                else {
                    y3 = poly[(i+lengthOfpoly - 1)%lengthOfpoly][1];
                    if ((y3-y1) * (y2 - y1) > 0)
                        nodes.push(p);
                }
            }
        }

        //当得到所有交点后，将这些交点按照x值排序
        nodes = sortNodes(nodes);

        //排序完成，两两配对画线
        len = nodes.length;
        for (var j = 0;j < (len - 1);j+=2) {
            var p1 = nodes[j];
            var p2 = nodes[j+1];
            drawLine(cxt,p1[0],p1[1],p2[0],p2[1],color);
        }
        nodes = [];
    }

    //内部渲染完成后，给边进行渲染
    for (var l = 0;l < poly.length;l++) {
        var p3 = poly[l];
        var p4 = poly[(l+1)%(poly.length)];
        drawLine(cxt,p3[0],p3[1],p4[0],p4[1],color);
    }
}

function sortNodes(nodes) {
    if (nodes.length > 0) {
        for (var i = 0;i < nodes.length - 1;i++) {
            for (var j = i+1;j < nodes.length;j++) {
                if (nodes[j][0] < nodes[i][0]) {
                    var tmp = nodes[j];
                    nodes[j] = nodes[i];
                    nodes[i] = tmp;
                }
            }
        }
    }
    return nodes;
}

//得到多边形最小和最大Y值
function getRangeOfY(poly) {
    var minY = 0;
    var maxY = 0;
    for (var i = 0;i < poly.length;i++) {
        if (poly[i][1] >= maxY)
            maxY = poly[i][1];
        if (poly[i][1] <= minY)
            minY = poly[i][1];
    }
    return [minY, maxY];
}

function renderAll(polygon) {
    for (var m = 0;m < polygon.length;m++) {
        var poly = [vertex_pos[polygon[m][0]],vertex_pos[polygon[m][1]],
            vertex_pos[polygon[m][2]],vertex_pos[polygon[m][3]]];
        render(poly,vertex_color[m]);
        poly = [];
    }
}



var c=document.getElementById("myCanvas");
var cxt=c.getContext("2d");

//将canvas坐标整体偏移0.5，用于解决宽度为1个像素的线段的绘制问题，具体原理详见project文档
cxt.translate(0.5, 0.5);

//鼠标按下，将鼠标按下坐标保存在x,y中
c.onmousedown = function(ev){
    var e = ev||event;
    var x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    var y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    //alert([x,y]);
    drag(x,y);
};

//拖拽函数
function drag(x,y) {
    // 按下鼠标判断鼠标位置是否在圆上，当画布上有多个路径时，isPointInPath只能判断最后那一个绘制的路径

    var numOfPoint = findPoint(x, y);
    //alert(numOfPoint);

    if (numOfPoint >= 0) {
        //路径正确，鼠标移动事件
        c.onmousemove = function (ev) {
            var e = ev || event;
            var ax = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            var ay = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;

            vertex_pos[numOfPoint][0] = ax - 10;
            vertex_pos[numOfPoint][1] = ay - 10;
            //鼠标移动每一帧都清楚画布内容，然后重新画圆
            cxt.clearRect(0, 0, c.width, c.height);
            renderAll(polygon);
            drawNinePoints(cxt,vertex_pos);
        };
        //鼠标移开事件
        c.onmouseup = function () {
            c.onmousemove = null;
            c.onmouseup = null;
        };
    }
}


renderAll(polygon);
drawNinePoints(cxt,vertex_pos);