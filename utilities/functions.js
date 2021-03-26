const md5 = require("md5");

const formatDate = (date) => {
  const dArr = date.toString().split(":")[0].split(" ")
  const res = dArr[2]+'/'+monToDigit(dArr[1].toLowerCase())+'/'+dArr[3]
  return res
};

const maxByDate = arr =>{
  for(let i=0 ; i<arr.length ; i++){
    
  }
}

const monToDigit = mon =>{
  switch(mon){
    case 'jan':
      return '01';
    case 'feb':
      return '02';
    case 'mar':
      return '03';
    case 'apr':
      return '04';
    case 'may':
      return '05';
    case 'jun':
      return '06';
    case 'jul':
      return '07';
    case 'aug':
      return '08';
    case 'sep':
      return '09';
    case 'oct':
      return '10';
    case 'nov':
      return '11';
    case 'dec':
      return '12';
    default:
      return ""
  }
}
const generateRandomNum = () => {
  let rand = "";
  for (let i = 0; i < 5; i++) {
    const rnd = Math.floor(Math.random() * 1000) + 1;
    rand += rnd.toString();
  }
  return parseInt(rand);
};
const generateToken = (details) => {
  const hash = md5(details);
  return hash;
};

const imagesPreview = function (input, placeToInsertImagePreview) {
  if (input.files) {
    let filesAmount = input.files.length;
    for (i = 0; i < filesAmount; i++) {
      let reader = new FileReader();
      reader.onload = function (event) {
        $($.parseHTML("<img>"))
        .attr("src", event.target.result)
          .appendTo(placeToInsertImagePreview);
      };
      reader.readAsDataURL(input.files[i]);
    }
  }
};

// Return error
const errorReport = (link,splitParam, matchTerm, errMess) =>{
  let err=""
  const splitLink = link.split(splitParam)
  pos = splitLink.length - 1;
  if (splitLink[pos] === matchTerm ) {
    err=errMess
  }
  return err
}
// UTI
const updateItemObjectFromForm = (prev, update) =>{
  const arr = Object.entries(update)
  const res = {...prev._doc}
    arr.forEach(up=>{
      let p= [up][0][0], q=[up][0][1]
      if(q!==""){
        res[p] = q
      }else{
        res[p]=res[p]
      }
    })
    return res
 
}
const breakInLines = () =>{
  
}
const filterObj = (arrayToFilter,filField, filterArg) =>{
  return arrayToFilter.filter(el => el[filField] === filterArg)
}

const paginate = (list,pageNumber,numberPerPage,start) =>{
  result = {}
  const data = list.slice(start, start+numberPerPage)
  const totalPagesCount = Math.ceil(list.length / numberPerPage)
  result.pageNumber = pageNumber
  result.start = start
  result.data = data
  result.totalPagesCount = totalPagesCount
  return result
}
// DB FUNC
const findOneObject = async(dbModel, searchField, searchArg,) =>{
  try {
    return await dbModel.findOne({[searchField]: searchArg})
    
  } catch (error) {
    return error
  }
 }
const findAllObjects = async(dbModel) =>{
  try {
    
    return await dbModel.find({})
  } catch (error) {
    return error
  }
 }
const createObject = async(dbModel,searchArg) =>{
  try {
  const arr = Object.entries(searchArg)
  const res = {}
    arr.forEach(up=>{
      let p= [up][0][0], q=[up][0][1]
      res[p] = q
    })
    const result = await new dbModel(res)
    result.save()
    return result
  } catch (error) {
    return error
  }
  
 }
const updateOneObject = async(dbModel, searchField, searchArg, update) =>{
  try {
    return await dbModel.updateOne(
      { [searchField]: searchArg },{$set: update,},(err, doc) => {
        if (err) console.log(err);
        else  console.log("success");
      }
    );
  } catch (error) {
    return error
  }
  
 }
 const deleteOneObject = async(dbModel,delField, delArg )=>{
  try{
    await dbModel.findOneAndDelete({[delField] : delArg}, (err)=>{
      if(err)console.log(err)
      else{
        console.log("success")
        return {
          status: 200,
          message: "Resource deleted successfully"
        }
      }
    })
  } catch (err){
    return err
  }
 
 }
const isAuthenticated = email=> {
  req.user.username === email? true : false
}
module.exports = {
  updateItemObjectFromForm,
  breakInLines,
  paginate,
  formatDate,
  generateToken,
  generateRandomNum,
  maxByDate,
  findOneObject,
  updateOneObject,
  errorReport,
  createObject,
  findAllObjects,
  isAuthenticated,
  deleteOneObject,
  filterObj
};
