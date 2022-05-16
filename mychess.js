const piece_dir = {"R":[[1, 0], [-1, 0], [0, 1], [0, -1]], "N":[[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]], "B": [[1, 1], [1, -1], [-1, 1], [-1, -1]], "Q":[[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], "K":[[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], "P":[[1, 0]]};
const p_dir_attack = [[1, -1], [1, 1]];
const piece_moven = {"R":-1, "N":1, "B":-1, "Q":-1, "K":1, "P":1};
const board_initial_piece = ["RNBQKBNR", "PPPPPPPP", "........", "........", "........", "........","PPPPPPPP","RNBQKBNR"];
const promote_piece = "QRBN";

function is_in(arr, pos)
{
    var answer = false;
    arr.forEach( elem =>
    {
        if (elem[0] == pos[0] && elem[1] == pos[1]) answer = true;
    });
    return answer;
}

class Piece {
    constructor(board, piece_name, piece_pos)
    {
        this.board = board;
        this.name = piece_name;
        this.pos = piece_pos;
        this.move_times = 0;
        this.team = piece_pos[0] < 2 ? 'W' : 'B';
        this.dom_elem = document.createElement("div");
        this.dom_elem.classList.add("piece", this.team+this.name);
        this.is_promoted = -1;
        this.is_enpassant = -1;
    }
    
	
	/*
	
	현재 구조
	
	(1) W팀 기물 클릭
	1. W팀 기물을 클릭하면 그 기물이 움직일 수 있는 경로를 뽑기 위해 possible_pos()가 실행된다.
	2. possible_pos() 안에서는 그 기물이 움직일 수 있는 경로로 움직였을 때 B팀에 의해 우리 왕이 공격받지는 않는지 확인하기 위해 각 좌표마다 check_if_this_piece_can_avoid_check()가 실행된다.
	3. check_if_this_piece_can_avoid_check()에서는 B팀의 각 기물이 W팀 왕을 공격할 수 있는지 확인하기 위해 각 기물마다 possible_pos()가 실행된다. 단, 이때 실행되는 possible_pos()는 this.team과 this.board.now_clicked.tema이 다르기 때문에 다시 check_if_this_piece_can_avoid_check()가 실행되지는 않는다. (무한루프 방지)
	
	(2) W팀 기물을 이동 경로로 이동시킴
	1. 이동시킬 좌표를 클릭하면 이동 연산을 수행하기 위해 move_to()가 실행되며, 이후 이동 연산을 끝마친 후 그 기물이 혹시 B팀 왕을 공격하지 않는지, 혹시 스테일메이트가 되진 않았는지 확인하기 위해 check_if_there_is_check_and_mates()가 실행된다.
	2. check_if_there_is_check_and_mates()에서는...
	- 체크인지 확인하기 위해 막 이동한 W팀 말이 이동할 수 있는 모든 경로를 체크한다. 이때 실행되는 possible_pos()는 this.team과 this.board.now_clicked.team이 같은데, 그럼에도 불구하고 그 말이 공격을 했을 때 W팀 왕이 공격당하는지 여부를 확인하는 check_if_this_piece_can_avoid_check()는 실행되어선 안된다 ㅡㅡ
	- W팀 기물 이동 완료 후 움직일 수 있는 B팀 기물이 있는지(스테일메이트가 아닌지) 확인하기 위해 B팀 기물에 대해 possible_pos()가 실행된다. 단 이때 실행되는 possible_pos()는 this.team과 this.board.now_clicked.team이 다르기 때문에 여기서 추가로 check_if_this_piece_can_avoid_check()가 실행되지는 않는다. (무한루프 방지)
	
	*/
	
	
    possible_pos() //현재 기물이 움직일 수 있는 경로를 모두 뽑아 리턴
    {
        var arr = [], col = this.pos[1], row = this.pos[0], moving_piece, r, c, loop_n;
    
		console.log(this.team, this.board.now_clicked.team);
	
        piece_dir[this.name].forEach( elem => {
            r = row + elem[0] * (this.team == 'W'?1:-1);
            c = col + elem[1];
            loop_n = 0;
        
            while((r <= 7 && r >= 0 && c <= 7 && c >= 0) && (piece_moven[this.name] == -1 || loop_n < piece_moven[this.name] || (loop_n == 1 && this.name == "P" && row == (this.team == 'W'?1:6))) && ( this.board.board[r][c] == false || this.board.board[r][c].team != this.team))
            {
                if (this.name == "P" && this.board.board[r][c]) break;
                if (this.name == "K") //왕은 '움직이면 체크인 곳'으로는 못 감.
                {
                    var not_available = false;
                    for (var i=0; i<8; i++)
                        for (var j=0; j<8; j++)
                            if (board.board[i][j] && board.board[i][j].team != this.team)
                            {
                                if (this.board.board[i][j].name != "K" && is_in(this.board.board[i][j].possible_pos(), [r, c])) not_available = true;
                                if (this.board.board[i][j].name == "K" && Math.abs(i-r) == 1 && Math.abs(c-j) == 1) not_available = true;                             
                            }
                    if (not_available == false)
                        arr.push([r, c]);
                }
                else if (this.team != this.board.now_clicked.team || (this.team == this.board.now_clicked.team && ((this.pgn_n > 0 &&this.pgn.length > this.pgn_n) || this.check_if_this_piece_can_avoid_check([r, c]))))
					//체크 상태라면 체크 상태를 이기는 수만 둘 수 있고. 지금 체크상태가 아니더라도 [r, c]로 움직여서 체크 될 상황이면 움직이면 안됨.
					//만약 지금 클릭한 기물의 이동 경로를 찾는 게 아니라, 클릭된 기물을 움직였을 때 혹시 체크 되는 건 아닌지 확인하기 위해 상대편 기물의 이동경로를 계산하는 상황이라면, '이 기물 움직여서 체크 되는 거 아냐?' 경우는 고려 필요 x. 무한루프 주의.
                    arr.push([r, c]);
                if (this.board.board[r][c]) break;
                r += elem[0] * (this.team == 'W'?1:-1);
                c += elem[1];
                loop_n++;
            }
        });


        if (this.name == 'P')
            p_dir_attack.forEach( elem => {
                r = row + elem[0] * (this.team == 'W'?1:-1);
                c = col + elem[1];
                if (r <= 7 && r >= 0 && c <= 7 && c >= 0)
                {
                    if (this.board.board[r][c] && this.board.board[r][c].team != this.team && (this.team != this.board.now_clicked.team  || (this.team == this.board.now_clicked.team && this.check_if_this_piece_can_avoid_check([r, c])))) //폰의 공격
                        arr.push([r, c]);
                    if (this.board.board[row][c] && this.board.board[row][c].name == "P" && this.board.board[row][c].team != this.team && this.board.board[row][c].is_enpassant >= 0) //앙파상
                        arr.push([r, c]);
                }
            });


        if (this.name == "K" && this.board.now_clicked.name == 'K' && this.move_times == 0 && this.board.checked == false && this.team == this.board.now_clicked.team) //캐슬링
        {
            if (this.board.board[row][0] && this.board.board[row][0].name == "R" && this.board.board[row][0].move_times == 0 && (this.board.board[row][1] || this.board.board[row][2] || this.board.board[row][3])==false && this.check_if_you_can_castle([row, 2]))
                arr.push([row, 2]);
            if (this.board.board[row][7] && this.board.board[row][7].name == "R" && this.board.board[row][7].move_times == 0 && (this.board.board[row][6] || this.board.board[row][5])==false && this.check_if_you_can_castle([row, 6]))
                arr.push([row, 6]);
        }
    
        return arr;
    }

    
    change_pos(pos)
    {   
        var killed_piece = this.board.board[pos[0]][pos[1]];
        
        this.board.board[this.pos[0]][this.pos[1]] = false;
        this.pos = pos;
        this.board.board[pos[0]][pos[1]] = this;
        
        while (this.board.cell_dom_elems[pos[0]][pos[1]].firstChild)
            this.board.cell_dom_elems[pos[0]][pos[1]].removeChild(this.board.cell_dom_elems[pos[0]][pos[1]].firstChild);
        this.board.cell_dom_elems[pos[0]][pos[1]].appendChild(this.dom_elem);
        
        if ("KRP".includes(this.name))
            this.move_times++;
        
        return killed_piece;
    }
	
	
	/*
	
	possible_pos() 함수를 여러개 만들어야 하는 이유
	
	1. 지금 현재 기물을 움직이기 위해 click했을 때 보드에 찍힐 경로를 출력하는 함수
	2. 1번을 출력하에 앞서, 혹시나 click된 기물을 어딘가로 움직였을 때 이로 인해 상대 기물에게 우리 왕이 공격받는 건 아닌지 체크하는 함수
	- 2번을 체크하기 위해, click된 기물을 어딘가로 움직인 상태에서 상대 기물이 우리 왕을 공격하는건 아닌지 체크하는 함수. 지금까지는 이 함수를 1번 함수랑 같은 걸 써서 무한루프 걸렸는데 같은거 쓰면 당연 안됨..
	
	
	*/
	
	

    check_if_this_piece_can_avoid_check(pos)
    {
        //this를 pos로 옮기면 체크를 피할 수 있는지, 또는 pos로 옮겨서 this.team의 왕이 체크 상태가 되는건 아닌지 확인하는 메서드
        
        var avoid_succeed=true, temp = this.board.board[pos[0]][pos[1]];
        this.board.board[pos[0]][pos[1]] = this;
		
		console.log(this);
        
        for (var i=0; i<8; i++)
            for (var j=0; j<8; j++)
                if (this.board.board[i][j] && this.board.board[i][j].team != this.team && avoid_succeed && is_in(this.board.board[i][j].possible_pos(), this.board.king[this.team].pos)) //현재 [i, j] 위치에 있는 상대편 기물이 혹시나 this.team의 왕을 공격하지 않는지?
                    avoid_succeed = false;

        this.board.board[pos[0]][pos[1]] = temp;
        return avoid_succeed;
    }

    check_if_you_can_castle(pos)
    {
        var avoid_check = true;
        for (var i=0; i<8; i++)
            for (var j=0; j<8; j++)
                if (this.board.board[i][j] && this.board.board[i][j].team != this.team && avoid_check)
                {
                    var possible_pos = this.board.board[i][j].possible_pos();
                    if (is_in(possible_pos, pos) || is_in(possible_pos, [pos[0], pos[1] == 2 ? 3: 5])) //[i, j]가 킹의 이동경로를 공격한다면 캐슬 불가.
                        avoid_check = false;
                }
        return avoid_check;
    }

}


class Board {
    
    constructor()
    {
        this.board = [];
        this.cell_dom_elems = [];
        this.checked = false;
        this.pgn = [];
        this.pgn_n = 0;
        this.now_clicked = null;
		this.king = {'W':null, 'B':null};


        this.promo_box = new PromoteBox(this);
        
        for (var i=0; i<8; i++)
        {
            this.board.push([]);
            this.cell_dom_elems.push([]);
            
            for (var j=0; j<8; j++)
            {
                this.cell_dom_elems[i].push(document.createElement("div"));
                this.cell_dom_elems[i][j].classList.add("cell", (i%2?j+1:j)%2 ? "cell_white" : "cell_black");
                this.cell_dom_elems[i][j].id = String.fromCharCode(j+65)+String.fromCharCode(i+49);
                this.board[i].push(false);
            }
        }
        
        this.new_game();
    }
    
    new_game()
    {
        this.pgn_n = 0; this.now_clicked = null; this.checked = false;
        const s = (Math.random() * 2 >= 1) ? [0, 7] : [7, 0];

        while(document.getElementById("board").childNodes.length > 0)
            document.getElementById("board").removeChild(document.getElementById("board").firstChild);
    
        var i = s[0];
        while(true)
        {
            var j = s[1];
            while(true)
            {
                document.getElementById("board").appendChild(this.cell_dom_elems[i][j]);
                while(this.cell_dom_elems[i][j].firstChild)
                    this.cell_dom_elems[i][j].removeChild(this.cell_dom_elems[i][j].firstChild);

                if (board_initial_piece[i][j] != '.')
                {
                    this.board[i][j] = new Piece(this, board_initial_piece[i][j], [i, j]);
                    this.cell_dom_elems[i][j].appendChild(this.board[i][j].dom_elem);
					if (board_initial_piece[i][j] == 'K')
						this.king[i==0 ? 'W' : 'B'] = this.board[i][j];
                }
                else
                    this.board[i][j] = false;
                
                if (j == s[0]) break;
                j += (s[1] - s[0] > 0) ? -1 : 1;
            } 

            if (i == s[1]) break;
            i += (s[1] - s[0] > 0) ? 1 : -1;
        }
        
        this.clear_clicked_state(false, true);
    }  
    
    
    clear_clicked_state(delete_all_eventlistener, change_turn)
    {
        for (var i=0; i<8; i++)
            for (var j=0; j<8; j++)
            {
                this.cell_dom_elems[i][j].classList.remove("path", "attacked", "clicked", "moved", "checked");
                this.cell_dom_elems[i][j].removeEventListener("click", move_to);

                if (this.board[i][j] && change_turn)
                {
                    if (this.pgn_n % 2 == (this.board[i][j].team == 'W' ? 1 : 0) || delete_all_eventlistener)
                        this.board[i][j].dom_elem.removeEventListener("click", click);
                    else
                        this.board[i][j].dom_elem.addEventListener("click", click);
                }
            }
        this.promo_box.close_window();
    }

    check_if_there_is_check_and_mates()
    {
        if (this.pgn_n ==0 ) 
        {
            this.clear_clicked_state(false, true);
            return;
        }
        this.checked = false;
        var king_pos = [], changed_pos = this.pgn[this.pgn_n-1][1], now_moved_piece = this.board[changed_pos[0]][changed_pos[1]];
        
        now_moved_piece.possible_pos().forEach(elem => {
            if (this.board[elem[0]][elem[1]] && this.board[elem[0]][elem[1]].team != now_moved_piece.team && this.board[elem[0]][elem[1]].name == "K")
            {
                this.checked = this.board[elem[0]][elem[1]];
                king_pos = elem;
            }
        });
    
        var is_checkmate = this.checked, is_stalemate = !this.checked;
        for (var i=0; i<8; i++)
            for (var j=0; j<8; j++)
            {
                if (this.board[i][j] == false || this.board[i][j].team == now_moved_piece.team) continue;
                if (is_checkmate)
                {
                    if (this.board[i][j].possible_pos().length > 0) //다른 기물로 체크 상태 피할 수 있으면 메이트 아님. 
                        is_checkmate = false;
                }
                else if(is_stalemate)
                {
                    if (this.board[i][j].possible_pos().length > 0)
                        is_stalemate = false;                
                }
            }

        this.clear_clicked_state(is_checkmate || is_stalemate, true);
        if (this.checked)
            this.cell_dom_elems[king_pos[0]][king_pos[1]].classList.add("checked");
        
        var before_pos = this.pgn[this.pgn_n-1][0];
        this.cell_dom_elems[before_pos[0]][before_pos[1]].classList.add("moved");
        this.cell_dom_elems[changed_pos[0]][changed_pos[1]].classList.add("moved");
    }

    
    previous()
    {
        var now_moved_piece = this.board[this.pgn[this.pgn_n-1][1][0]][this.pgn[this.pgn_n-1][1][1]];
        if (this.pgn_n == now_moved_piece.is_promoted)
        {
            now_moved_piece.dom_elem.classList.remove(now_moved_piece.team + now_moved_piece.name);
            now_moved_piece.name = "P";
            now_moved_piece.dom_elem.classList.add(now_moved_piece.team + "P");
        }

        if (now_moved_piece.name == "K" && Math.abs(now_moved_piece.pos[1] - this.pgn[this.pgn_n-1][0][1]) >= 2)
        {
            if (Math.abs(now_moved_piece.pos[1] - this.pgn[this.pgn_n-1][0][1]) == 2)
                this.board[now_moved_piece.pos[0]][2].change_pos([now_moved_piece.pos[0], 0]);
            else
                this.board[now_moved_piece.pos[0]][4].change_pos([now_moved_piece.pos[0], 7]);
        }

        
        now_moved_piece.change_pos(this.pgn[this.pgn_n-1][0]);
        this.board[this.pgn[this.pgn_n-1][1][0]][this.pgn[this.pgn_n-1][1][1]] = false;
        if (this.pgn[this.pgn_n-1][2]) 
        {
            this.board[this.pgn[this.pgn_n-1][2].pos[0]][this.pgn[this.pgn_n-1][2].pos[1]] = this.pgn[this.pgn_n-1][2];
            this.cell_dom_elems[this.pgn[this.pgn_n-1][2].pos[0]][this.pgn[this.pgn_n-1][2].pos[1]].appendChild(this.pgn[this.pgn_n-1][2].dom_elem);
        }
            
        if (this.pgn[this.pgn_n-1][2].is_enpassant == this.pgn_n-1)
            this.pgn[this.pgn_n-1][2].is_enpassant = -1;
        
        this.pgn_n--;
        if (this.pgn_n == 0) document.getElementById("previous").disabled = 'disabled';
        //if (document.getElementById("next").disabled) document.getElementById("next").disabled = '';
        this.check_if_there_is_check_and_mates();
    }
    
    
    next()
    {
    }
        
}


class PromoteBox {
    constructor(board)
    {
        this.board = board;
        this.dom_elem = document.getElementById("promote_box");
        for (var i=0; i<promote_piece.length; i++)
        {            
            const promo_piece_wrapper = document.createElement("div");
            promo_piece_wrapper.classList.add('cell', 'cell_white');
            promo_piece_wrapper.id = promote_piece[i];
            this.dom_elem.appendChild(promo_piece_wrapper);
        }
        this.dom_elem.style = 'display:none';
    }
    
    close_window()
    {
        this.dom_elem.childNodes.forEach( elem => {
            while(elem.firstChild)
                elem.removeChild(elem.firstChild);
        });
        this.dom_elem.style = 'display:none';

    }

    open_window(piece)
    {
        this.dom_elem.style = 'display:flex';
        this.dom_elem.childNodes.forEach( elem => {
            if (elem.id != undefined)
            {
                var promo_piece = document.createElement("div");
                promo_piece.classList.add("piece", piece.team+elem.id);
                promo_piece.addEventListener("click", promote);
                elem.appendChild(promo_piece);
            }
        });

        for (var i=0; i<8; i++)
            for (var j=0; j<8; j++)
                if (this.board.board[i][j])
                    this.board.board[i][j].dom_elem.removeEventListener("click", click);

    }
    

}


board = new Board();
document.getElementById("previous").addEventListener("click", e=>board.previous());
//document.getElementById("next").addEventListener("click", e=>board.next());
document.getElementById("new_game").addEventListener("click", e=>board.new_game());

    function click(e)
    {
        col = e.target.parentNode.id.charCodeAt(0) - 65;
        row = e.target.parentNode.id.charCodeAt(1) - 49;
        if (board.cell_dom_elems[row][col].classList.contains("clicked"))
        {
            board.clear_clicked_state(false, false);
            board.cell_dom_elems[board.pgn[board.pgn_n-1][0][0]][board.pgn[board.pgn_n-1][0][1]].classList.add("moved");
            board.cell_dom_elems[board.pgn[board.pgn_n-1][1][0]][board.pgn[board.pgn_n-1][1][1]].classList.add("moved");
            if (board.checked)
                board.cell_dom_elems[board.checked.pos[0]][board.checked.pos[1]].classList.add("checked");
        }
        else
        {
            board.clear_clicked_state(false, false);
            if (board.pgn_n >= 1)
            {
                board.cell_dom_elems[board.pgn[board.pgn_n-1][0][0]][board.pgn[board.pgn_n-1][0][1]].classList.add("moved");
                board.cell_dom_elems[board.pgn[board.pgn_n-1][1][0]][board.pgn[board.pgn_n-1][1][1]].classList.add("moved");
            }
            if (board.checked)
                board.cell_dom_elems[board.checked.pos[0]][board.checked.pos[1]].classList.add("checked");
            board.now_clicked = board.board[row][col];
            board.cell_dom_elems[row][col].classList.add("clicked");
            board.now_clicked.possible_pos().forEach( elem => {
                board.cell_dom_elems[elem[0]][elem[1]].classList.remove("moved");
                if (board.board[elem[0]][elem[1]] == false)
                {
                    if (board.now_clicked.name == "P" && elem[1] != col)
                        board.cell_dom_elems[elem[0]][elem[1]].classList.add("attacked");
                    else
                        board.cell_dom_elems[elem[0]][elem[1]].classList.add("path");
                }
                else if (board.board[elem[0]][elem[1]].team != board.now_clicked.team)
                    board.cell_dom_elems[elem[0]][elem[1]].classList.add("attacked");
                board.cell_dom_elems[elem[0]][elem[1]].addEventListener("click", move_to);
            });
        }
    }

    function move_to(e)
    {
        moved_pos = e.target.id == '' ? e.target.parentNode.id : e.target.id;
    
        col1 = board.now_clicked.pos[1];
        row1 = board.now_clicked.pos[0];    
        col2 = moved_pos.charCodeAt(0) - 65;
        row2 = moved_pos.charCodeAt(1) - 49;

        if (board.now_clicked.name == "K" && Math.abs(col2 - col1) >= 2) //캐슬링
        {
            if (col2 - col1 == 2)
                board.board[row1][7].change_pos([row1, 5]);
            else
                board.board[row1][0].change_pos([row1, 3]);
        }

        killed_piece = board.now_clicked.change_pos([row2, col2]);


        if (board.now_clicked.name == "P")
        {
            if (Math.abs(row2-row1) == 2 && ((col2 >= 1 && board.board[row2][col2-1] && board.board[row2][col2-1].name=="P") ||(col2 <= 6 && board.board[row2][col2+1] && board.board[row2][col2+1].name=="P")))
                board.now_clicked.is_enpassant = board.pgn_n;
            
            if (col1 != col2 && killed_piece == false) //앙파상
            {
                board.cell_dom_elems[row1][col2].removeChild(board.cell_dom_elems[row1][col2].firstChild);
                killed_piece = board.board[row1][col2];
                board.board[row1][col2] = false;
            }
        }


    
        if (board.pgn.length > board.pgn_n)
        {
            board.pgn = board.pgn.slice(0, board.pgn_n);
            board.pgn_n = board.pgn.length;
        }
        board.pgn.push([[row1, col1], board.now_clicked.pos, killed_piece]); 
        board.check_if_there_is_check_and_mates();
		board.pgn_n++;
        if (board.now_clicked.name == "P" && row2 == (board.now_clicked.team == "W"?7 : 0))
            board.promo_box.open_window(board.now_clicked);
        
        if (document.getElementById("previous").disabled) document.getElementById("previous").disabled = '';
        //document.getElementById("next").disabled = 'disabled';
    
    }
    function promote(e)
    {
        piece = board.board[board.now_clicked.pos[0]][board.now_clicked.pos[1]];
        piece.name = e.target.parentNode.id;
        piece.is_promoted = board.pgn_n;
        piece.dom_elem.classList.remove(piece.team + "P");
        piece.dom_elem.classList.add(piece.team + piece.name);
        board.cell_dom_elems[board.now_clicked.pos[0]][board.now_clicked.pos[1]].removeChild(board.now_clicked.dom_elem);
        board.cell_dom_elems[board.now_clicked.pos[0]][board.now_clicked.pos[1]].appendChild(board.board[board.now_clicked.pos[0]][board.now_clicked.pos[1]].dom_elem);
        board.promo_box.close_window();
        board.check_if_there_is_check_and_mates();
    }