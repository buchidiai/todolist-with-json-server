/*
  client side
    template: static template
    logic(js): MVC(model, view, controller): used to server side technology, single page application
        model: prepare/manage data,
        view: manage view(DOM),
        controller: business logic, event bindind/handling

  server side
    json-server
    CRUD: create(post), read(get), update(put, patch), delete(delete)


*/

function myFetch(url, options = {}) {
  return new Promise((res, rej) => {
    let xhr = new XMLHttpRequest()
    xhr.open(options.method || "GET", url)
    xhr.responseType = "json"
    for (let headerName in options.headers) {
      xhr.setRequestHeader(headerName, options.headers[headerName])
    }
    xhr.onload = () => {
      res(xhr.response)
    }
    xhr.onerror = () => {
      rej(new Error("myFetch failed"))
    }
    xhr.send(options.body)
  })
}

const APIs = (() => {
  const createTodo = (newTodo) => {
    return myFetch("http://localhost:3000/todos", {
      method: "POST",
      body: JSON.stringify(newTodo),
      headers: { "Content-Type": "application/json" },
    })
  }

  const updateTodo = (todo) => {
    return myFetch("http://localhost:3000/todos/" + todo.id, {
      method: "PUT",
      body: JSON.stringify(todo),
      headers: { "Content-Type": "application/json" },
    })
  }

  const deleteTodo = (id) => {
    return myFetch("http://localhost:3000/todos/" + id, {
      method: "DELETE",
    })
  }

  const getTodos = () => {
    return myFetch("http://localhost:3000/todos")
  }
  return { createTodo, deleteTodo, getTodos, updateTodo }
})()

const Model = (() => {
  class State {
    #todos //private field
    #onChange //function, will be called when setter function todos is called
    constructor() {
      this.#todos = []
    }
    get todos() {
      return this.#todos
    }
    set todos(newTodos) {
      // reassign value
      console.log("setter function")
      this.#todos = newTodos
      this.#onChange?.() // rendering
    }

    subscribe(callback) {
      //subscribe to the change of the state todos
      this.#onChange = callback
    }
  }
  const { getTodos, createTodo, deleteTodo, updateTodo } = APIs
  return {
    State,
    getTodos,
    createTodo,
    deleteTodo,
    updateTodo,
  }
})()
/*
    todos = [
        {
            id:1,
            content:"eat lunch"
        },
        {
            id:2,
            content:"eat breakfast"
        }
    ]

*/
const View = (() => {
  const todolistEl = document.querySelector("#pending-tasks")
  const completedTodolistEl = document.querySelector("#completed-tasks")
  const submitBtnEl = document.querySelector(".submit-btn")
  const inputEl = document.querySelector("#submit-task")
  const editEl = document.querySelector(".edit-btn")
  const deleteEl = document.querySelector(".delete-btn")
  const moveLeftEl = document.querySelector(".move-left-icn")
  const moveRightEl = document.querySelector(".mv-right-btn")
  const itemText = document.querySelector(".item-text")

  const renderTodos = (todos) => {
    let todosTemplate = ""
    let completeTodosTemplate = ""
    todos.forEach((todo) => {
      if (todo.completed === true) {
        const liTemplate = `<ul class="task-container" id="completed-tasks">
        <li class="item-container">
        <i id="${todo.id}" class="fa fa-arrow-left move-left-icn move-icn btn"></i>
        <div class="item-text">${todo.content}</div>
        <div class="item-actions">
          <i id="${todo.id}" class="fa fa-edit edit-icn btn edit-btn"></i>
          <i id="${todo.id}" class="fa fa-trash delete-icn btn delete-btn"></i>
        </div>
        <input type="text" class="edit-input" style="display: none" />
      </li>
    </ul>`
        completeTodosTemplate += liTemplate
      } else {
        const liTemplate = `<ul class="task-container" id="pending-tasks">
      <li class="item-container">
        <div class="item-text">${todo.content}</div>
        <div class="item-actions">
          <i  id="${todo.id}" class="fa fa-edit edit-icn btn edit-btn"></i>
          <i  id="${todo.id}" class="fa fa-trash delete-icn btn delete-btn"></i>
          <i  id="${todo.id}" class="fa fa-arrow-right move-icn btn move-right-icn"></i>
        </div>
      </li>
    </ul>`

        todosTemplate += liTemplate
      }
    })
    if (todos.length === 0) {
      todosTemplate = "<h4>no task to display!</h4>"
    }
    todolistEl.innerHTML = todosTemplate
    completedTodolistEl.innerHTML = completeTodosTemplate
  }

  const clearInput = () => {
    inputEl.value = ""
  }

  return { renderTodos, submitBtnEl, inputEl, completedTodolistEl, clearInput, todolistEl, itemText, editEl, deleteEl, moveLeftEl, moveRightEl }
})()

const Controller = ((view, model) => {
  console.log(view, "editEl viewwww")
  const state = new model.State()
  const init = () => {
    model.getTodos().then((todos) => {
      todos.reverse()
      state.todos = todos
    })
  }

  const handleSubmit = () => {
    view.submitBtnEl.addEventListener("click", (event) => {
      /*
                1. read the value from input
                2. post request
                3. update view
            */
      const inputValue = view.inputEl.value
      model.createTodo({ content: inputValue }).then((data) => {
        state.todos = [data, ...state.todos]
        view.clearInput()
      })
    })
  }

  const handleUpdate = () => {
    view.todolistEl.addEventListener("click", (event) => {
      const deleteBtnRegex = /delete-btn/g
      const editBtnRegex = /edit-btn/g
      const moveLeftBtnRegex = /move-left-icn/g
      const moveRightBtnRegex = /move-right-icn/g
      const elementClass = event.target.className
      const hasDeleteBtn = elementClass.match(deleteBtnRegex)
      const hasEditBtn = elementClass.match(editBtnRegex)
      const hasMoveLeftBtn = elementClass.match(moveLeftBtnRegex)
      const hasMoveRightBtn = elementClass.match(moveRightBtnRegex)
      console.log("======on click==============")
      console.log(elementClass)
      console.log("====================================")
      if (hasDeleteBtn) {
        const id = event.target.id
        model.deleteTodo(+id).then((data) => {
          state.todos = state.todos.filter((todo) => todo.id !== +id)
        })
      } else if (hasEditBtn) {
        const id = event.target.id
        const itemContainerEl = event.target.closest(".item-container")
        const itemTextEl = itemContainerEl.querySelector(".item-text")
        const itemActionsEl = itemContainerEl.querySelector(".item-actions")

        if (!itemContainerEl.classList.contains("editing")) {
          // show the input field
          itemTextEl.style.display = "none"
          const inputEl = document.createElement("input")
          inputEl.value = itemTextEl.textContent
          inputEl.classList.add("item-input")
          itemContainerEl.insertBefore(inputEl, itemActionsEl)
          itemContainerEl.classList.add("editing")
        } else {
          // save changes and hide the input field
          const inputEl = itemContainerEl.querySelector(".item-input")
          const inputValue = inputEl.value
          model.updateTodo({ id, content: inputValue }).then((data) => {
            state.todos = state.todos.map((todo) => {
              if (todo.id === data.id) {
                return data
              }
              return todo
            })
          })
          itemTextEl.textContent = inputValue
          itemTextEl.style.display = "block"
          itemContainerEl.removeChild(inputEl)
          itemContainerEl.classList.remove("editing")
        }
      } else if (hasMoveLeftBtn) {
        console.log("move item left")
        const id = event.target.parentElement.parentElement.querySelector(".edit-icn").id

        console.log(id)

        const todo = state.todos.find((t) => t.id == id)

        console.log(todo)
        if (todo) {
          model
            .updateTodo({
              id: todo.id,
              content: todo.content,
              completed: false,
            })
            .then((data) => {
              state.todos = state.todos.map((t) => {
                if (t.id === data.id) {
                  return data
                }
                return t
              })
            })
        }
      } else if (hasMoveRightBtn) {
        console.log("move item right")
        const id = event.target.parentElement.parentElement.querySelector(".edit-icn").id
        console.log(id)
        const todo = state.todos.find((t) => t.id == id)
        console.log(todo)
        if (todo) {
          model
            .updateTodo({
              id: todo.id,
              content: todo.content,
              completed: true,
            })
            .then((data) => {
              state.todos = state.todos.map((t) => {
                if (t.id === data.id) {
                  return data
                }
                return t
              })
            })
        }
      }
    })
  }

  const bootstrap = () => {
    init()
    handleSubmit()
    handleUpdate()
    state.subscribe(() => {
      view.renderTodos(state.todos)
    })
  }
  return {
    bootstrap,
  }
})(View, Model) //ViewModel

Controller.bootstrap()
