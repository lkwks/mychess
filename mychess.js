const piece_dir = {"R":[[1, 0], [-1, 0], [0, 1], [0, -1]], "N":[[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]], "B": [[1, 1], [1, -1], [-1, 1], [-1, -1]], "Q":[[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], "K":[[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], "P":[[1, 0]]};
const p_dir_attack = [[1, -1], [1, 1]];

const piece_moven = {"R":-1, "N":1, "B":-1, "Q":-1, "K":1, "P":1};

const board_initial_piece = ["RNBKQBNR", "PPPPPPPP", "........", "........", "........", "........","PPPPPPPP","RNBKQBNR"];
const board_initial_team = ["WWWWWWWW", "WWWWWWWW", "........", "........", "........", "........","BBBBBBBB","BBBBBBBB"];

const promote_piece = "QRBN";

var board_piece, board_team;

function to_str(i, j)
{
    return String.fromCharCode(j+65)+String.fromCharCode(i+49);
}

function new_game()
{
    board_piece = JSON.parse(JSON.stringify(board_initial_piece)); board_team = JSON.parse(JSON.stringify(board_initial_team));
    
    s = (Math.random() * 2 >= 1) ? [0, 8] : [7, -1];

    while(document.getElementById("board").childNodes.length > 0)
        document.getElementById("board").removeChild(document.getElementById("board").firstChild);
    
    for (i=s[0]; i != s[1];)
    {
        for (j=s[0]; j != s[1];)
        {
            elem = document.createElement("div");
            elem.id = to_str(i, j);
            elem.classList.add("cell", (i%2?j+1:j)%2 ? "cell_white" : "cell_black");
            document.getElementById("board").appendChild(elem);
            
            elem = document.getElementById(to_str(i, j));
            if (board_piece[i][j] != '.')
            {
                new_piece = document.createElement("div");
                new_piece.classList.add("piece", board_team[i][j]+board_piece[i][j]);
                
                if (board_team[i][j] == "W")
                    new_piece.addEventListener("click", on_click_piece);
                
                elem.appendChild(new_piece);
            }
            j += (s[1] - s[0] > 0) ? 1 : -1;
        }
        i += (s[1] - s[0] > 0) ? 1 : -1;
    }
}

document.getElementById("new_game").addEventListener("click", new_game);
new_game();

function possible_pos(clicked_piece_pos)
{
    var arr = [];
    col = clicked_piece_pos.charCodeAt(0) - 65;
    row = clicked_piece_pos.charCodeAt(1) - 49;

    im_checked = false;
    for (i=0; i<8; i++)
        for (j=0; j<8; j++)
        {
            if (document.getElementById(to_str(i, j)).classList.contains("clicked"))
                moving_piece_pos = to_str(i, j); 
            if (document.getElementById(to_str(i, j)).classList.contains("checked"))
                im_checked = true;
        }    
    
    piece_dir[board_piece[row][col]].forEach( elem => {
        r = row + elem[0] * (board_team[row][col] == 'W'?1:-1);
        c = col + elem[1];
        loop_n = 0;
        
        while((r <= 7 && r >= 0 && c <= 7 && c >= 0) && (piece_moven[board_piece[row][col]] == -1 || loop_n < piece_moven[board_piece[row][col]] || (loop_n == 1 && board_piece[row][col] == "P" && row == (board_team[row][col] == 'W'?1:6))) && board_team[r][c] != board_team[row][col])
        {
            if (board_piece[row][col] == "K") //왕은 움직이면 체크인 곳으로는 못 감.
            {
                not_available = false;
                for (i=0; i<8; i++)
                    for (j=0; j<8; j++)
                        if (board_piece[i][j] != "." && board_team[i][j] != board_team[row][col])
                            if (possible_pos(to_str(i, j)).includes([r, c])) not_available = true;
                if (not_available == false)
                    arr.push([r, c]);
            }
            else if (im_checked)
            {
                if (document.getElementById(to_str(r, c)).classList.contains("moved") && board_team[r][c] != '.') //체크 상태고 지금 클릭한 게 왕이 아니라면 체크한 말을 죽이는 선택만 가능
                    arr.push([r, c]);
            }
            else 
            {
                if (board_piece[row][col] == "P" && board_team[r][c] != '.') break;
                arr.push([r, c]);
            }
            if (board_team[r][c] != '.') break;
            r += elem[0] * (board_team[row][col] == 'W'?1:-1);
            c += elem[1];
            loop_n++;
        }
        
        if (board_piece[row][col] == 'P')
            p_dir_attack.forEach( elem => {
                r = row + elem[0] * (board_team[row][col] == 'W'?1:-1);
                c = col + elem[1];
                if (r <= 7 && r >= 0 && c <= 7 && c >= 0 && board_team[r][c] != '.' && board_team[r][c] != board_team[row][col])
                    arr.push([r, c]);
            });
    });
    
    return arr;
}

function clear_clicked_state(delete_all_eventlistener)
{
    for (i=0; i<8; i++)
        for (j=0; j<8; j++)
        {
            document.getElementById(to_str(i, j)).classList.remove("path", "attacked", "clicked");
            document.getElementById(to_str(i, j)).removeEventListener("click", move);
            if (delete_all_eventlistener)
                document.getElementById(to_str(i, j)).removeEventListener("click", on_click_piece);
        }
}

function check_if_there_is_check_and_mates(row, col)
{
    is_check = false;
    possible_pos(to_str(row, col)).forEach(elem => {
        if (board_team[elem[0]][elem[1]] != board_team[row2][col2] && board_piece[elem[0]][elem[1]] == "K")
        {
            is_check = true;
            document.getElementById(to_str(elem[0], elem[1])).classList.add("checked");
        }
    });
    
    is_checkmate = false;
    is_stalemate = !is_check;
    for (i=0; i<8; i++)
        for (j=0; j<8; j++)
        {
            document.getElementById(to_str(i, j)).classList.remove("moved");
            if (is_check == false)
                document.getElementById(to_str(i, j)).classList.remove("checked");
                        
            if (board_team[i][j] == board_team[row2][col2] || board_team[i][j] == '.') continue;
            if (is_check)
            {
                if (board_piece[i][j] == 'K')
                {
                    if (possible_pos(to_str(i, j)).length == 0)
                        is_checkmate = true;
                }
            }
            else if (is_stalemate)
            {
                if (possible_pos(to_str(i, j)).length > 0)
                        is_stalemate = false;                
            }
        }
    tomove_elem.classList.add("moved");
    document.getElementById(moving_piece_pos).classList.add("moved");
    
    clear_clicked_state(is_checkmate || is_stalemate);
}


function promote(e)
{
    if (e.target.classList.contains("WQ") ||  e.target.classList.contains("BQ")) promo_piece_name = "Q";
    if (e.target.classList.contains("WR") ||  e.target.classList.contains("BR")) promo_piece_name = "R";
    if (e.target.classList.contains("WB") ||  e.target.classList.contains("BB")) promo_piece_name = "B";
    if (e.target.classList.contains("WN") ||  e.target.classList.contains("BN")) promo_piece_name = "N";
    
    for (i=0; i<8; i++)
        for (j=0; j<8; j++)
            if (board_piece[i][j] == "P" && (i==0 || i==7))
            {
                board_piece[i] = board_piece[i].substr(0, j) + promo_piece_name + board_piece[i].substr(j+1, 7-j);
                document.getElementById(to_str(i, j)).firstChild.classList.remove(board_team[i][j]+"P");
                document.getElementById(to_str(i, j)).firstChild.classList.add(board_team[i][j]+promo_piece_name);
                row = i; col = j;
            }
    
    while(document.getElementById("promote_box").childNodes.length > 0)
        document.getElementById("promote_box").removeChild(document.getElementById("promote_box").firstChild);
    
    check_if_there_is_check_and_mates(row, col);
}

function move(e)
{
    moved_pos = e.target.id == '' ? e.target.parentNode.id : e.target.id;
    
    for (i=0; i<8; i++)
        for (j=0; j<8; j++)
            if (document.getElementById(to_str(i, j)).classList.contains("clicked"))
                moving_piece_pos = to_str(i, j); 
    
    col1 = moving_piece_pos.charCodeAt(0) - 65;
    row1 = moving_piece_pos.charCodeAt(1) - 49;    
    col2 = moved_pos.charCodeAt(0) - 65;
    row2 = moved_pos.charCodeAt(1) - 49;
    board_piece[row2] = board_piece[row2].substr(0, col2) + board_piece[row1][col1] + board_piece[row2].substr(col2+1, 7-col2);
    board_team[row2] = board_team[row2].substr(0, col2) + board_team[row1][col1] + board_team[row2].substr(col2+1, 7-col2);
    board_piece[row1] = board_piece[row1].substr(0, col1) + '.' + board_piece[row1].substr(col1+1, 7-col1);
    board_team[row1] = board_team[row1].substr(0, col1) + '.' + board_team[row1].substr(col1+1, 7-col1);
    
    tomove_elem = document.getElementById(moved_pos);
    if (tomove_elem.firstChild != null)
        tomove_elem.removeChild(tomove_elem.firstChild);
    moving_piece_elem = document.getElementById(moving_piece_pos).firstChild;
    document.getElementById(moving_piece_pos).removeChild(moving_piece_elem);
    tomove_elem.appendChild(moving_piece_elem);
    
    
    
    if (board_piece[row2][col2] == "P" && row2 == (board_team[row2][col2] == "W"?7 : 0))
    {
        for (i=0; i<promote_piece.length; i++)
        {
            promo_box = document.getElementById("promote_box");
            
            promo_piece_wrapper = document.createElement("div");
            promo_piece_wrapper.classList.add('cell', 'cell_white');
            promo_box.appendChild(promo_piece_wrapper);
            
            promo_piece = document.createElement("div");
            promo_piece.classList.add("piece", board_team[row2][col2]+promote_piece[i]);
            promo_piece.addEventListener("click", promote);
            promo_piece_wrapper.appendChild(promo_piece);
        }
    }
    
    check_if_there_is_check_and_mates(row2, col2);
    
}


function on_click_piece(e)
{
    clicked_piece_pos = e.target.parentNode.id;
    if (document.getElementById(clicked_piece_pos).classList.contains("clicked"))
        clear_clicked_state(false);
    else
    {
        clear_clicked_state(false);
        document.getElementById(clicked_piece_pos).classList.add("clicked");
        possible_pos(clicked_piece_pos).forEach( elem => {
        
            new_pos = document.getElementById(to_str(elem[0], elem[1]));
        
            if (board_piece[elem[0]][elem[1]] == '.')
                new_pos.classList.add("path");
            else if (board_team[elem[0]][elem[1]] != board_team[clicked_piece_pos.charCodeAt(1) - 49][clicked_piece_pos.charCodeAt(0) - 65])
                new_pos.classList.add("attacked");
            new_pos.addEventListener("click", move);
        });
    }
}