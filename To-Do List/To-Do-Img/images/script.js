const inputBox  = document.getElementById("input");
const listContainer = document.getElementById("list-container");

function addTask(){
    if(inputBox.value === ''){
        alert("you must write something");
    }
    else{
        let li = document.createElement("li");
        li.innerHTML = inputBox.value ;
        listContainer.appendChild(li);
        let span = document.createElement("span");
        span.innerHTML ="\u00d7";
        li.appendChild(span);
    }
    inputBox.value =" ";
    saveData();
}

listContainer.addEventListener("click"  , function(e) {
    if(e.target.tagName === "LI"){
        e.target.classList.toggle("checked");
        saveData();
    }
    else if(e.target.tagName === "SPAN"){
        e.target.parentElement.remove();
        saveData();
    }
} , false);
// this function saves data to localstorage
function saveData(){
    localStorage.setItem("data" , listContainer.innerHTML);
}
// this function shows data from localstorage
function showTasks(){
    listContainer.innerHTML = localStorage.getItem("data");
}
showTasks();