var size = 10;
var piece;
var board = [];
var bs = new Array();
var undo_stack = new Array();
var redo_stack = new Array();
var editable = true;

var showBoard = function(){
    if(undo_stack.length > 0)document.getElementById("undo").disabled=false;
    else document.getElementById("undo").disabled=true;
    if(redo_stack.length > 0)document.getElementById("redo").disabled=false;
    else document.getElementById("redo").disabled=true;



    var b = document.getElementById("board");
    while(b.firstChild){
        b.removeChild(b.firstChild);
    }
    for(var i=0;i<size;i++){
        for(var j=0;j<size;j++){
            var c = piece[board[i][j]].cloneNode(true);
            c.style.top = (i*32)+"px";
            c.style.left = (j*32)+"px";
            b.appendChild(c);
            (function(){
                var _i = i, _j = j;
                c.onclick = function(){
                    if(!editable)return;
                    editable=false;
                    if(undo_stack.length==0 || !eq(undo_stack[undo_stack.length-1],board)){
                        undo_stack.push(clone_board());
                        redo_stack=new Array();
                    }

                    if(board[_i][_j]<=1){
                        board[_i][_j]+=2;
                    }
                    else if(board[_i][_j]>=2){
                        board[_i][_j]-=2;
                    }
                    showBoard();
                    editable=true;
                };
            })();
        }
    }

    var nbs = new Array();
    for(var i=0;i<size;++i){
        for(var j=0;j<size;++j){
            if(board[i][j]>=2)nbs.push("("+i+","+j+")");
        }
    }
    bs = nbs;
    console.log("bs: "+bs);
    console.log(undo_stack, redo_stack);
}

function eq(b1,b2){
    for(var i=0;i<size;++i){
        for(var j=0;j<size;++j){
            if(b1[i][j]!=b2[i][j])return false;
        }
    }
    return true;
}


function kp(event){
    console.log(pressedChar(event));
    if(event.keyCode==13)reset();

    var char = pressedChar(event);
    if (char && !char.match(/\d/)) {
        return false;
    } else {
        return true;
    }
}

function pressedChar(event) {
    var code = 0;
    if (event.charCode === 0) {// Firefox, Safari control code
        code = 0;
    } else if (!event.keyCode && event.charCode) {// Firefox
        code = event.charCode;
    } else if (event.keyCode && !event.charCode) {// IE
        code = event.keyCode;
    } else if (event.keyCode == event.charCode) {// Safari
        code = event.keyCode;
    }
    if (32 <= code && code <= 126) {// not ASCII
        return String.fromCharCode(code);
    } else {
        return null;
    }
}

function Pair(first, second) {
    this.first = first;
    this.second = second;    
}
Pair.prototype.toString=function(){
    return "("+this.first+","+this.second+")";
}

function decompose(){
    if(!editable)return;
    editable=false;

    if(undo_stack.length==0 || !eq(undo_stack[undo_stack.length-1],board)){
        undo_stack.push(clone_board());
        redo_stack=new Array();
    }
    //R: 0~size-1, C: size~2*size-1, s: 2*size, t: 2*size+1
    var s = 2*size;
    var t = 2*size+1;
    var adj = [];
    console.log("decompose");
    for(var i = 0; i<2*size+2;i++){
        adj[i]=[];
        for(var j = 0; j<2*size+2;j++){
            adj[i][j]=0;
            if(i==s && j<size)adj[s][j]=1;
            if(size<=i && i<2*size && j==t)adj[i][t]=1;
            if(i<size && size<=j && j<2*size && board[i][j-size]>=2)adj[i][j]=1;
        }
    }
    //console.log("adj: "+adj);

    //max flow
    var matching = 0;
    while(true){
        var vqueue = new Array();
        var fqueue = new Array();
        var from = [];
        for(var i=0;i<2*size+2;i++){
            from[i]=-1;
        }
        vqueue.push(s);
        fqueue.push(s);
        while(vqueue.length>0){
            var v = vqueue.shift();
            var f = fqueue.shift();
            if(from[v]>=0)continue;
            from[v]=f;
            if(v==t)break;
            for(var u=0;u<2*size+2;u++){
                if(adj[v][u]==1){
                    vqueue.push(u);
                    fqueue.push(v);
                }
            }
        }


        if(from[t]<0)break;
        var u = t;
        var v = from[t];
        while(u!=s){
            adj[v][u]=0;
            adj[u][v]=1;

            u=from[u];
            v=from[v];
        }
        matching++;
    }
    //strong component
    //マッチング枝を双方向に
    var mpair = [];
    for(var i = size; i<2*size;i++){
        for(var j = 0; j<size;j++){
            if(adj[i][j]>0){
                adj[j][i]=1;
                mpair.push(new Pair(j,i-size));
            }
        }
    }
    var vinf = new Array();    
    var vzero = new Array();    
    var visit = [];
    for(var i=0;i<2*size+2;i++){
        visit[i]=false;
    }
    console.log("match: "+mpair+", size:"+size);

    //vinf
    var queue = new Array();
    queue.push(s);
    while(queue.length>0){
        var v = queue.shift();
        if(visit[v])continue;
        visit[v]=true;
        if(v!=s)vinf.push(v);
        for(var u=0;u<2*size;u++){
            if(adj[v][u]==1){
                queue.push(u);
            }
        }        
    }
    //vzero
    queue = new Array();
    queue.push(t);
    while(queue.length>0){
        var v = queue.shift();
        if(visit[v])continue;
        visit[v]=true;
        if(v!=t)vzero.push(v);
        for(var u=0;u<2*size;u++){
            if(adj[u][v]==1){
                queue.push(u);
            }
        }        
    }
    vinf.sort();
    vzero.sort();
    console.log("vinf: "+vinf);
    console.log("vzero: "+vzero);

    var stack1 = new Array();
    var stack2 = new Array();
    var stackc = new Array();
    var added = [];
    var visit1 = [];
    var visit2 = [];
    var order = new Array();
    var scc = [];
    for(var i=0;i<2*size;i++){
        if(!visit[i])stack1.push(i);
        visit1[i]=0;
        visit2[i]=0;
        scc[i]=-1;
    }
    while(stack1.length>0){
        var v = stack1[stack1.length-1];
        if(visit1[v]>0){
            stack1.pop();
            if(visit1[v]==1){
                stack2.push(v);
                stackc.push(v);
            }
            visit1[v]=2;
            continue;
        }
        visit1[v]=1;
        for(var u=0;u<2*size;u++){
            if(visit[u]==0 && adj[v][u]==1){
                stack1.push(u);
            }
        }

    }
    while(stack2.length>0){
        var v = stack2[stack2.length-1];
        var c = stackc[stackc.length-1];
        if(visit2[v]>0){
            stack2.pop();
            stackc.pop();
            if(visit2[v]==1){
                order.push(v);
                scc[v]=c;
            }
            visit2[v]=2;
            continue;
        }
        visit2[v]=1;
        for(var u=0;u<2*size;u++){
            if(visit[u]==0 && adj[u][v]==1){
                stack2.push(u);
                stackc.push(c);
            }
        }        
    }

    var rorder = new Array();
    var corder = new Array();
    for(var i=0;i<vzero.length;i++){
        if(vzero[i]<size)rorder.push(vzero[i]);
        else corder.push(vzero[i]-size);
    }
    for(var i=0;i<order.length;i++){
        if(order[i]<size)rorder.push(order[i]);
        else corder.push(order[i]-size);
    }
    for(var i=0;i<vinf.length;i++){
        if(vinf[i]<size)rorder.push(vinf[i]);
        else corder.push(vinf[i]-size);
    }

    var newboard = [];
    for(var i=0;i<size;i++){
        newboard[i]=[];
        for(var j=0;j<size;j++){
            newboard[i][j]=(board[rorder[i]][corder[j]]&2);
            if(scc[rorder[i]]>=0 && scc[rorder[i]]==scc[corder[j]+size])newboard[i][j]+=1;
            else if(contain(vinf,rorder[i]) && contain(vinf,corder[j]+size))newboard[i][j]+=1;
            else if(contain(vzero,rorder[i]) && contain(vzero,corder[j]+size))newboard[i][j]+=1;
        }
    }
    
    board=newboard;
    console.log("rorder: "+rorder);
    console.log("corder: "+corder);


    showBoard();
    editable = true;
}

function contain(as, a){
    for(var i=0;i<as.length;i++){
        if(as[i]==a)return true;
    }
    return false;
}


function reset(){
    bs = new Array();
    size=parseInt(document.getElementById("board-size").value);
    if(size>32){
        document.getElementById("board-size").value=32;
        size=32;
    }
    if(size<2){
        document.getElementById("board-size").value=2;
        size=2;
    }
    board = [];
    for(var i = 0; i<size;i++){
        board[i] = [];
        for(var j=0;j<size;j++){
            board[i][j] = 0;
        }
    }
    undo_stack=new Array();
    redo_stack=new Array();
    showBoard();
}

function undo(){
    if(!editable)return;
    editable=false;

    if(undo_stack.length > 0){
        redo_stack.push(clone_board());
        board=undo_stack.pop();
    }
    bs = new Array();
    for(var i=0; i<size; i++){
        for(var j=0; j<size; j++){
            if(board[i][j]==1)bs.push(i+j*size);      
        }
    }

    showBoard();
    editable=true;
}

function redo(){
    if(!editable)return;
    editable=false;

    if(redo_stack.length > 0){
        undo_stack.push(clone_board());
        board=redo_stack.pop();
    }
    bs = new Array();
    for(var i=0; i<size; i++){
        for(var j=0; j<size; j++){
            if(board[i][j]==1)bs.push(i+j*size);      
        }
    }

    showBoard();
    editable=true;
}

function clone_board(){
    cb = [];  
    for(var i = 0; i<size;i++){
        cb[i] = [];
        for(var j=0;j<size;j++){
            cb[i][j] = board[i][j];
        }
    }
    return cb;    
}

onload = function(){
    //0: empty, 1: empty (block), 2: nonzero, 3: nonzero (block)
    piece = [document.getElementById("cell"),document.getElementById("bcell"),document.getElementById("nonzero"),document.getElementById("bnonzero")];
    for(var i = 0; i<size;i++){
        board[i] = [];
        for(var j=0;j<size;j++){
            board[i][j] = 0;
        }
    }
    showBoard();
};
