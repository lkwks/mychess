const piece_dir = {"R":[[1, 0], [-1, 0], [0, 1], [0, -1]], "N":[[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]], "B": [[1, 1], [1, -1], [-1, 1], [-1, -1]], "Q":[[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], "K":[[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], "P":[[1, 0]]};
const p_dir_attack = [[1, -1], [1, 1]];
const piece_moven = {"R":-1, "N":1, "B":-1, "Q":-1, "K":1, "P":1};
const board_initial_piece = ["RNBQKBNR", "PPPPPPPP", "........", "........", "........", "........","PPPPPPPP","RNBQKBNR"];
const promote_piece = "QRBN";



class Piece {
    constructor(piece_name, piece_pos)
    {
        this.name = piece_name;
        this.pos = piece_pos;
        this.move_times = 0;
        this.team = piece_pos[0] < 2 ? 'W' : 'B';
        this.dom_elem = document.createElement("div");
        this.dom_elem.classList.add("piece", this.team+this.name);
        this.is_promoted = -1;
    }
    
    possible_pos() //현재 기물이 움직일 수 있는 경로를 모두 뽑아 리턴
    {
        var arr = [], col = this.pos[1], row = this.pos[0], moving_piece, r, c, loop_n;
    
        piece_dir[this.name].forEach( elem => {
            r = row + elem[0] * (this.team == 'W'?1:-1);
            c = col + elem[1];
            loop_n = 0;
        
            while((r <= 7 && r >= 0 && c <= 7 && c >= 0) && (piece_moven[this.name] == -1 || loop_n < piece_moven[this.name] || (loop_n == 1 && this.name == "P" && row == (this.team == 'W'?1:6))) && ( board.board[r][c] == false || board.board[r][c].team != this.team))
            {
                if (this.name == "K") //왕은 '움직이면 체크인 곳'으로는 못 감.
                {
                    var not_available = false;
                    for (var i=0; i<8; i++)
                        for (var j=0; j<8; j++)
                            if (board.board[i][j] && board.board[i][j].team != this.team)
                            {
                                if (board.board[i][j].name != "K" && board.board[i][j].possible_pos().includes([r, c])) not_available = true;
                                if (board.board[i][j].name == "K" && Math.abs(i-r) == 1 && Math.abs(c-j) == 1) not_available = true;                             
                            }
                    if (not_available == false)
                        arr.push([r, c]);
                }
                else if (board.checked)
                {
                    if (board.cell_dom_elems[r][c].classList.contains("moved") && board.board[r][c]) //체크 상태고 지금 클릭한 게 왕이 아니라면 '체크한 말'을 죽이는 선택만 가능
                        arr.push([r, c]);
                }
                else 
                {
                    if (this.name == "P" && board.board[r][c]) break;
                    arr.push([r, c]);
                }
                if (board.board[r][c]) break;
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
                    if (board.board[r][c] && board.board[r][c].team != this.team) //폰의 공격
                        arr.push([r, c]);
                    if (board.board[row][c] && board.board[row][c].name == "P" && board.board[row][c].team != this.team && board.board[row][c].moved_times == 1) //앙파상
                        arr.push([r, c]);
                }
            });


        if (this.name == 'K' && this.move_times == 0) //캐슬링
        {
            if (board.board[row][0] && board.board[row][0].name == "R" && board.board[row][0].move_times == 0 && (board.board[row][1] || board.board[row][2] || board.board[row][3])==false)
                arr.push([row, 2]);
            if (board.board[row][7] && board.board[row][7].name == "R" && board.board[row][7].move_times == 0 && (board.board[row][6] || board.board[row][5])==false)
                arr.push([row, 6]);
        }
    
        return arr;
    }

    
    change_pos(pos)
    {   
        var killed_piece = board.board[pos[0]][pos[1]];
        
        board.board[this.pos[0]][this.pos[1]] = false;
        this.pos = pos;
        board.board[pos[0]][pos[1]] = this;
        
        while (board.cell_dom_elems[pos[0]][pos[1]].firstChild)
            board.cell_dom_elems[pos[0]][pos[1]].removeChild(board.cell_dom_elems[pos[0]][pos[1]].firstChild);
        board.cell_dom_elems[pos[0]][pos[1]].appendChild(this.dom_elem);
        
        if ("KR".includes(this.name))
            this.move_times++;
        
        return killed_piece;
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


        this.promo_box = document.getElementById("promote_box");
        for (var i=0; i<promote_piece.length; i++)
        {            
            const promo_piece_wrapper = document.createElement("div");
            promo_piece_wrapper.classList.add('cell', 'cell_white');
            promo_piece_wrapper.id = promote_piece[i];
            this.promo_box.appendChild(promo_piece_wrapper);
        }
        this.promo_box.style = 'display:none';
        
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
                    this.board[i][j] = new Piece(board_initial_piece[i][j], [i, j]);
                    this.cell_dom_elems[i][j].appendChild(this.board[i][j].dom_elem);
                    
                    if (this.board[i][j].team == 'W')
                        this.board[i][j].dom_elem.addEventListener("click", click);
                }
                else
                    this.board[i][j] = false;
                
                if (j == s[0]) break;
                j += (s[1] - s[0] > 0) ? -1 : 1;
            } 

            if (i == s[1]) break;
            i += (s[1] - s[0] > 0) ? 1 : -1;
        }
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
    }

    check_if_there_is_check_and_mates()
    {
        var is_check = false, king_pos = [], changed_pos = this.pgn[this.pgn_n-1][1], now_moved_piece = this.board[changed_pos[0]][changed_pos[1]];
        
        now_moved_piece.possible_pos().forEach(elem => {
            if (this.board[elem[0]][elem[1]] && this.board[elem[0]][elem[1]].team != now_moved_piece.team && this.board[elem[0]][elem[1]].name == "K")
            {
                is_check = true;
                king_pos = elem;
            }
        });
    
        var is_checkmate = false, is_stalemate = !is_check;
        for (var i=0; i<8; i++)
            for (var j=0; j<8; j++)
            {
                if (this.board[i][j] == false || this.board[i][j].team == now_moved_piece.team) continue;
                if (is_check)
                {
                    if (this.board[i][j].name == 'K')
                    {
                        if (this.board[i][j].possible_pos().length == 0)
                            is_checkmate = true;
                    }
                }
                else if (is_stalemate)
                {
                    if (this.board[i][j].possible_pos().length > 0)
                        is_stalemate = false;                
                }
            }
                
        this.clear_clicked_state(is_checkmate || is_stalemate, true);
        if (is_check)
            this.cell_dom_elems[king_pos[0]][king_pos[1]].classList.add("checked");
        
        var before_pos = this.pgn[this.pgn_n-1][0];
        this.cell_dom_elems[before_pos[0]][before_pos[1]].classList.add("moved");
        this.cell_dom_elems[changed_pos[0]][changed_pos[1]].classList.add("moved");
    }

    open_promote_box(piece)
    {
        this.promo_box.style = 'display:flex';
        this.promo_box.childNodes.forEach( elem => {
            if (elem.id != undefined)
            {
                var promo_piece = document.createElement("div");
                promo_piece.classList.add("piece", piece.team+elem.id);
                promo_piece.addEventListener("click", promote);
                elem.appendChild(promo_piece);
            }
        });
    }
    
    
    previous()
    {
        now_moved_piece = this.board[this.pgn[this.pgn_n-1][1][0]][this.pgn[this.pgn_n-1][1][1]];
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
        this.board[this.pgn[this.pgn_n-1][1][0]][this.pgn[this.pgn_n-1][1][1]] = this.pgn[this.pgn_n-1][2];
        if (this.pgn[this.pgn_n-1][2]) 
            this.cell_dom_elems[this.pgn[this.pgn_n-1][2].pos[0]][this.pgn[this.pgn_n-1][2].pos[1]].appendChild(this.pgn[this.pgn_n-1][2].dom_elem);
        
        
        this.pgn_n--;
        if (this.pgn_n == 0) document.getElementById("previous").disabled = 'disabled';
        //if (document.getElementById("next").disabled) document.getElementById("next").disabled = '';
        this.clear_clicked_state(false, true);
    }
    
    
    next()
    {
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
            board.clear_clicked_state(false, false);
        else
        {
            board.clear_clicked_state(false, false);
            board.now_clicked = board.board[row][col];
            board.cell_dom_elems[row][col].classList.add("clicked");
            board.board[row][col].possible_pos().forEach( elem => {
                if (board.board[elem[0]][elem[1]] == false)
                    board.cell_dom_elems[elem[0]][elem[1]].classList.add("path");
                else if (board.board[elem[0]][elem[1]].team != board.board[row][col].team)
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


        if (board.now_clicked.name == "P" && col1 != col2 && board.board[row2][col2] == false) //앙파상
        {
            board.cell_dom_elems[row1][col2].removeChild(board.cell_dom_elems[row1][col2].firstChild);
            killed_piece = board.board[row1][col2];
            board.board[row1][col2] = false;
        }


        if (board.now_clicked.name == "P" && row2 == (board.now_clicked.team == "W"?7 : 0))
            board.open_promote_box(board.now_clicked);
    
        if (board.pgn.length > board.pgn_n)
        {
            board.pgn = board.pgn.slice(0, board.pgn_n);
            board.pgn_n = board.pgn.length;
        }
        board.pgn.push([[row1, col1], board.now_clicked.pos, killed_piece]); board.pgn_n++;
        board.check_if_there_is_check_and_mates();
        
        if (document.getElementById("previous").disabled) document.getElementById("previous").disabled = '';
        //document.getElementById("next").disabled = 'disabled';
    
    }
    function promote(e)
    {
        promote_piece = board.board[board.now_clicked.pos[0]][board.now_clicked.pos[1]];
        promote_piece.name = e.target.parentNode.id;
        promote_piece.is_promoted = board.pgn_n;
        promote_piece.dom_elem.classList.remove(promote_piece.team + "P");
        promote_piece.dom_elem.classList.add(promote_piece.team + promote_piece.name);
        board.cell_dom_elems[board.now_clicked.pos[0]][board.now_clicked.pos[1]].removeChild(board.now_clicked.dom_elem);
        board.cell_dom_elems[board.now_clicked.pos[0]][board.now_clicked.pos[1]].appendChild(board.board[board.now_clicked.pos[0]][board.now_clicked.pos[1]].dom_elem);
        board.promo_box.style = 'display:none';
        board.check_if_there_is_check_and_mates();
    }