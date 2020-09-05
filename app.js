//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

//telling our app which template engine to use
//we dont have to direct our server to the files
//process.cwd() +/views is the default views file
//could be changed by another app.set('views', path.join(__dirname, 'views')
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));//parse incoming request
//bodies before our handler
//bodyParser.urlencoded({extended: ...}) basically tells the system
// whether you want to use a simple algorithm for shallow parsing
// (i.e. false) or complex algorithm for deep parsing that can deal
// with nested objects (i.e. true). (stackoverflow knwoledge)
app.use(express.static("public"));//this serves all static files in the public
//folder

//substitute your dets
mongoose.connect('mongodb+srv://mydets', {useNewUrlParser:true, useUnifiedTopology: true});
//connecting to our mongoose server

//our object schema for our different collections
//within todolistDB
const itemsSchema = {
  name: String
};

const listSchema = {
    name:String,
    items: [itemsSchema]
};


//our models (created to be invoked)
const List = mongoose.model('List', listSchema);
const Item = mongoose.model("Item", itemsSchema);

//our new created items, added thereafter into an array
const item1 = new Item ({name:'Get food'});
const item2 = new Item({name:'Try get food '});
const item3 = new Item({name:"Improve"});
const defaultItems = [item1, item2, item3];

//when our server is given a GET request to the home route
//it is to perform our callback function. Which itself entails checking the length
//of our list in the DB if 0, we then append the default items. Otherwise, we
//merely render our
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if(foundItems.length ===0) {

      Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(err);
        } else {
          console.log('Successfully saved default items to db!');
        }
      });
      res.redirect('/');
    } else{
      res.render("list", {listTitle: 'Today', newListItems: foundItems});
    }
  });

});

//all post requests to the home route are handled here, if in the home route
//we just save else we look for our given list add to that list then redirect to that list
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName==="Today") {
      item.save();
      res.redirect('/');
  } else{
      List.findOne({name:listName}, function(err, foundList){
          foundList.items.push(item);
          foundList.save();
          res.redirect("/"+listName);
      })
  }


});


//when post to the delete route a post we want to delete, in essence same procedure
//as adding
app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName ==='Today'){
      Item.findByIdAndRemove(checkedItemId, function(err){
          if (err){
              console.log(err)
          } else{
              console.log('Successfully deleted item from our to do list')
              res.redirect('/');
          }
      });
  } else {
      List.findOneAndUpdate({name: listName},
          //$pull in MongoDb removes from an existing array all instances
          // of a value or values that match a specified condition
          {$pull:{items:{_id: checkedItemId}}}, function (err, foundList) {
                if(!err){
                    res.redirect('/'+listName);
                }
          });
  }


});


//handling any other route for a list
app.get("/:customListName", function(req,res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
        if(!err){
            if(!foundList){
                //create a newList
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect('/'+customListName);
            } else {
                //show an existing list
                res.render('list', {listTitle: foundList.name, newListItems: foundList.items})
            }
        }
    });


});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if(port == null || port === ""){
    port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});
