// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {

VVVV.Makros = [
  {name: "Value", command: "<PATCH><NODE id={id} systemname='IOBox (Value Advanced)'><BOUNDS type='Node' left={left} top={top}></BOUNDS></NODE></PATCH>"},
  {name: "String", command: "<PATCH><NODE id={id} systemname='IOBox (String)'><BOUNDS type='Node' left={left} top={top}></BOUNDS></NODE></PATCH>"},
  {name: "Color", command: "<PATCH><NODE id={id} systemname='IOBox (Color)'><BOUNDS type='Node' left={left} top={top}></BOUNDS></NODE></PATCH>"},
  {name: "3D Vector", command: "<PATCH><NODE id={id} systemname='IOBox (Value Advanced)' componentmode='InABox'><BOUNDS type='Box' left={left} top={top} width='100' height='100'><PIN pinname='Y Input Value' values='|0|,|0|,|0|'></PIN><PIN pinname='Rows' visible='0' values='|3|'></PIN></BOUNDS></NODE></PATCH>"},
  {name: "+ (String)", command: "<PATCH><NODE id={id} systemname='Add (String)'><BOUNDS type='Node' left={left} top={top}></BOUNDS></NODE></PATCH>"},
  {name: "+1", command: "<PATCH><NODE id={id} systemname='Add (Value)'><PIN pinname='Input 2' values='|1|'></PIN><BOUNDS type='Node' left={left} top={top}></BOUNDS></NODE></PATCH>"},
  {name: "-1", command: "<PATCH><NODE id={id} systemname='Subtract (Value)'><PIN pinname='Input 2' values='|1|'></PIN><BOUNDS type='Node' left={left} top={top}></BOUNDS></NODE></PATCH>"},
  {name: "*2", command: "<PATCH><NODE id={id} systemname='Multiply (Value)'><PIN pinname='Input 2' values='|2|'></PIN><BOUNDS type='Node' left={left} top={top}></BOUNDS></NODE></PATCH>"},
  {name: "/2", command: "<PATCH><NODE id={id} systemname='Divide (Value)'><PIN pinname='Input 2' values='|2|'></PIN><BOUNDS type='Node' left={left} top={top}></BOUNDS></NODE></PATCH>"},
]
  
  
}(vvvvjs_jquery));
