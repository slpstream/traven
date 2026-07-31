// src/plugin.js
import { TravenPlugin, Decorations, WidgetType, syntaxTree } from "@freedomware/traven";

// ../../node_modules/@lezer/common/dist/index.js
var DefaultBufferLength = 1024;
var nextPropID = 0;
var NodeProp = class {
  /**
  Create a new node prop type.
  */
  constructor(config = {}) {
    this.id = nextPropID++;
    this.perNode = !!config.perNode;
    this.deserialize = config.deserialize || (() => {
      throw new Error("This node type doesn't define a deserialize function");
    });
    this.combine = config.combine || null;
  }
  /**
  This is meant to be used with
  [`NodeSet.extend`](#common.NodeSet.extend) or
  [`LRParser.configure`](#lr.ParserConfig.props) to compute
  prop values for each node type in the set. Takes a [match
  object](#common.NodeType^match) or function that returns undefined
  if the node type doesn't get this prop, and the prop's value if
  it does.
  */
  add(match) {
    if (this.perNode)
      throw new RangeError("Can't add per-node props to node types");
    if (typeof match != "function")
      match = NodeType.match(match);
    return (type) => {
      let result = match(type);
      return result === void 0 ? null : [this, result];
    };
  }
};
NodeProp.closedBy = new NodeProp({ deserialize: (str) => str.split(" ") });
NodeProp.openedBy = new NodeProp({ deserialize: (str) => str.split(" ") });
NodeProp.group = new NodeProp({ deserialize: (str) => str.split(" ") });
NodeProp.isolate = new NodeProp({ deserialize: (value) => {
  if (value && value != "rtl" && value != "ltr" && value != "auto")
    throw new RangeError("Invalid value for isolate: " + value);
  return value || "auto";
} });
NodeProp.contextHash = new NodeProp({ perNode: true });
NodeProp.lookAhead = new NodeProp({ perNode: true });
NodeProp.mounted = new NodeProp({ perNode: true });
var MountedTree = class {
  constructor(tree, overlay, parser, bracketed = false) {
    this.tree = tree;
    this.overlay = overlay;
    this.parser = parser;
    this.bracketed = bracketed;
  }
  /**
  @internal
  */
  static get(tree) {
    return tree && tree.props && tree.props[NodeProp.mounted.id];
  }
};
var noProps = /* @__PURE__ */ Object.create(null);
var NodeType = class _NodeType {
  /**
  @internal
  */
  constructor(name2, props, id, flags = 0) {
    this.name = name2;
    this.props = props;
    this.id = id;
    this.flags = flags;
  }
  /**
  Define a node type.
  */
  static define(spec) {
    let props = spec.props && spec.props.length ? /* @__PURE__ */ Object.create(null) : noProps;
    let flags = (spec.top ? 1 : 0) | (spec.skipped ? 2 : 0) | (spec.error ? 4 : 0) | (spec.name == null ? 8 : 0);
    let type = new _NodeType(spec.name || "", props, spec.id, flags);
    if (spec.props)
      for (let src of spec.props) {
        if (!Array.isArray(src))
          src = src(type);
        if (src) {
          if (src[0].perNode)
            throw new RangeError("Can't store a per-node prop on a node type");
          props[src[0].id] = src[1];
        }
      }
    return type;
  }
  /**
  Retrieves a node prop for this type. Will return `undefined` if
  the prop isn't present on this node.
  */
  prop(prop) {
    return this.props[prop.id];
  }
  /**
  True when this is the top node of a grammar.
  */
  get isTop() {
    return (this.flags & 1) > 0;
  }
  /**
  True when this node is produced by a skip rule.
  */
  get isSkipped() {
    return (this.flags & 2) > 0;
  }
  /**
  Indicates whether this is an error node.
  */
  get isError() {
    return (this.flags & 4) > 0;
  }
  /**
  When true, this node type doesn't correspond to a user-declared
  named node, for example because it is used to cache repetition.
  */
  get isAnonymous() {
    return (this.flags & 8) > 0;
  }
  /**
  Returns true when this node's name or one of its
  [groups](#common.NodeProp^group) matches the given string.
  */
  is(name2) {
    if (typeof name2 == "string") {
      if (this.name == name2)
        return true;
      let group = this.prop(NodeProp.group);
      return group ? group.indexOf(name2) > -1 : false;
    }
    return this.id == name2;
  }
  /**
  Create a function from node types to arbitrary values by
  specifying an object whose property names are node or
  [group](#common.NodeProp^group) names. Often useful with
  [`NodeProp.add`](#common.NodeProp.add). You can put multiple
  names, separated by spaces, in a single property name to map
  multiple node names to a single value.
  */
  static match(map) {
    let direct = /* @__PURE__ */ Object.create(null);
    for (let prop in map)
      for (let name2 of prop.split(" "))
        direct[name2] = map[prop];
    return (node) => {
      for (let groups = node.prop(NodeProp.group), i = -1; i < (groups ? groups.length : 0); i++) {
        let found = direct[i < 0 ? node.name : groups[i]];
        if (found)
          return found;
      }
    };
  }
};
NodeType.none = new NodeType(
  "",
  /* @__PURE__ */ Object.create(null),
  0,
  8
  /* NodeFlag.Anonymous */
);
var CachedNode = /* @__PURE__ */ new WeakMap();
var CachedInnerNode = /* @__PURE__ */ new WeakMap();
var IterMode;
(function(IterMode2) {
  IterMode2[IterMode2["ExcludeBuffers"] = 1] = "ExcludeBuffers";
  IterMode2[IterMode2["IncludeAnonymous"] = 2] = "IncludeAnonymous";
  IterMode2[IterMode2["IgnoreMounts"] = 4] = "IgnoreMounts";
  IterMode2[IterMode2["IgnoreOverlays"] = 8] = "IgnoreOverlays";
  IterMode2[IterMode2["EnterBracketed"] = 16] = "EnterBracketed";
})(IterMode || (IterMode = {}));
var Tree = class _Tree {
  /**
  Construct a new tree. See also [`Tree.build`](#common.Tree^build).
  */
  constructor(type, children, positions, length, props) {
    this.type = type;
    this.children = children;
    this.positions = positions;
    this.length = length;
    this.props = null;
    if (props && props.length) {
      this.props = /* @__PURE__ */ Object.create(null);
      for (let [prop, value] of props)
        this.props[typeof prop == "number" ? prop : prop.id] = value;
    }
  }
  /**
  @internal
  */
  toString() {
    let mounted = MountedTree.get(this);
    if (mounted && !mounted.overlay)
      return mounted.tree.toString();
    let children = "";
    for (let ch of this.children) {
      let str = ch.toString();
      if (str) {
        if (children)
          children += ",";
        children += str;
      }
    }
    return !this.type.name ? children : (/\W/.test(this.type.name) && !this.type.isError ? JSON.stringify(this.type.name) : this.type.name) + (children.length ? "(" + children + ")" : "");
  }
  /**
  Get a [tree cursor](#common.TreeCursor) positioned at the top of
  the tree. Mode can be used to [control](#common.IterMode) which
  nodes the cursor visits.
  */
  cursor(mode = 0) {
    return new TreeCursor(this.topNode, mode);
  }
  /**
  Get a [tree cursor](#common.TreeCursor) pointing into this tree
  at the given position and side (see
  [`moveTo`](#common.TreeCursor.moveTo).
  */
  cursorAt(pos, side = 0, mode = 0) {
    let scope = CachedNode.get(this) || this.topNode;
    let cursor = new TreeCursor(scope);
    cursor.moveTo(pos, side);
    CachedNode.set(this, cursor._tree);
    return cursor;
  }
  /**
  Get a [syntax node](#common.SyntaxNode) object for the top of the
  tree.
  */
  get topNode() {
    return new TreeNode(this, 0, 0, null);
  }
  /**
  Get the [syntax node](#common.SyntaxNode) at the given position.
  If `side` is -1, this will move into nodes that end at the
  position. If 1, it'll move into nodes that start at the
  position. With 0, it'll only enter nodes that cover the position
  from both sides.
  
  Note that this will not enter
  [overlays](#common.MountedTree.overlay), and you often want
  [`resolveInner`](#common.Tree.resolveInner) instead.
  */
  resolve(pos, side = 0) {
    let node = resolveNode(CachedNode.get(this) || this.topNode, pos, side, false);
    CachedNode.set(this, node);
    return node;
  }
  /**
  Like [`resolve`](#common.Tree.resolve), but will enter
  [overlaid](#common.MountedTree.overlay) nodes, producing a syntax node
  pointing into the innermost overlaid tree at the given position
  (with parent links going through all parent structure, including
  the host trees).
  */
  resolveInner(pos, side = 0) {
    let node = resolveNode(CachedInnerNode.get(this) || this.topNode, pos, side, true);
    CachedInnerNode.set(this, node);
    return node;
  }
  /**
  In some situations, it can be useful to iterate through all
  nodes around a position, including those in overlays that don't
  directly cover the position. This method gives you an iterator
  that will produce all nodes, from small to big, around the given
  position.
  */
  resolveStack(pos, side = 0) {
    return stackIterator(this, pos, side);
  }
  /**
  Iterate over the tree and its children, calling `enter` for any
  node that touches the `from`/`to` region (if given) before
  running over such a node's children, and `leave` (if given) when
  leaving the node. When `enter` returns `false`, that node will
  not have its children iterated over (or `leave` called).
  */
  iterate(spec) {
    let { enter, leave, from = 0, to = this.length } = spec;
    let mode = spec.mode || 0, anon = (mode & IterMode.IncludeAnonymous) > 0;
    for (let c = this.cursor(mode | IterMode.IncludeAnonymous); ; ) {
      let entered = false;
      if (c.from <= to && c.to >= from && (!anon && c.type.isAnonymous || enter(c) !== false)) {
        if (c.firstChild())
          continue;
        entered = true;
      }
      for (; ; ) {
        if (entered && leave && (anon || !c.type.isAnonymous))
          leave(c);
        if (c.nextSibling())
          break;
        if (!c.parent())
          return;
        entered = true;
      }
    }
  }
  /**
  Get the value of the given [node prop](#common.NodeProp) for this
  node. Works with both per-node and per-type props.
  */
  prop(prop) {
    return !prop.perNode ? this.type.prop(prop) : this.props ? this.props[prop.id] : void 0;
  }
  /**
  Returns the node's [per-node props](#common.NodeProp.perNode) in a
  format that can be passed to the [`Tree`](#common.Tree)
  constructor.
  */
  get propValues() {
    let result = [];
    if (this.props)
      for (let id in this.props)
        result.push([+id, this.props[id]]);
    return result;
  }
  /**
  Balance the direct children of this tree, producing a copy of
  which may have children grouped into subtrees with type
  [`NodeType.none`](#common.NodeType^none).
  */
  balance(config = {}) {
    return this.children.length <= 8 ? this : balanceRange(NodeType.none, this.children, this.positions, 0, this.children.length, 0, this.length, (children, positions, length) => new _Tree(this.type, children, positions, length, this.propValues), config.makeTree || ((children, positions, length) => new _Tree(NodeType.none, children, positions, length)));
  }
  /**
  Build a tree from a postfix-ordered buffer of node information,
  or a cursor over such a buffer.
  */
  static build(data) {
    return buildTree(data);
  }
};
Tree.empty = new Tree(NodeType.none, [], [], 0);
var FlatBufferCursor = class _FlatBufferCursor {
  constructor(buffer, index) {
    this.buffer = buffer;
    this.index = index;
  }
  get id() {
    return this.buffer[this.index - 4];
  }
  get start() {
    return this.buffer[this.index - 3];
  }
  get end() {
    return this.buffer[this.index - 2];
  }
  get size() {
    return this.buffer[this.index - 1];
  }
  get pos() {
    return this.index;
  }
  next() {
    this.index -= 4;
  }
  fork() {
    return new _FlatBufferCursor(this.buffer, this.index);
  }
};
var TreeBuffer = class _TreeBuffer {
  /**
  Create a tree buffer.
  */
  constructor(buffer, length, set) {
    this.buffer = buffer;
    this.length = length;
    this.set = set;
  }
  /**
  @internal
  */
  get type() {
    return NodeType.none;
  }
  /**
  @internal
  */
  toString() {
    let result = [];
    for (let index = 0; index < this.buffer.length; ) {
      result.push(this.childString(index));
      index = this.buffer[index + 3];
    }
    return result.join(",");
  }
  /**
  @internal
  */
  childString(index) {
    let id = this.buffer[index], endIndex = this.buffer[index + 3];
    let type = this.set.types[id], result = type.name;
    if (/\W/.test(result) && !type.isError)
      result = JSON.stringify(result);
    index += 4;
    if (endIndex == index)
      return result;
    let children = [];
    while (index < endIndex) {
      children.push(this.childString(index));
      index = this.buffer[index + 3];
    }
    return result + "(" + children.join(",") + ")";
  }
  /**
  @internal
  */
  findChild(startIndex, endIndex, dir, pos, side) {
    let { buffer } = this, pick = -1;
    for (let i = startIndex; i != endIndex; i = buffer[i + 3]) {
      if (checkSide(side, pos, buffer[i + 1], buffer[i + 2])) {
        pick = i;
        if (dir > 0)
          break;
      }
    }
    return pick;
  }
  /**
  @internal
  */
  slice(startI, endI, from) {
    let b = this.buffer;
    let copy = new Uint16Array(endI - startI), len = 0;
    for (let i = startI, j = 0; i < endI; ) {
      copy[j++] = b[i++];
      copy[j++] = b[i++] - from;
      let to = copy[j++] = b[i++] - from;
      copy[j++] = b[i++] - startI;
      len = Math.max(len, to);
    }
    return new _TreeBuffer(copy, len, this.set);
  }
};
function checkSide(side, pos, from, to) {
  switch (side) {
    case -2:
      return from < pos;
    case -1:
      return to >= pos && from < pos;
    case 0:
      return from < pos && to > pos;
    case 1:
      return from <= pos && to > pos;
    case 2:
      return to > pos;
    case 4:
      return true;
  }
}
function resolveNode(node, pos, side, overlays) {
  var _a;
  while (node.from == node.to || (side < 1 ? node.from >= pos : node.from > pos) || (side > -1 ? node.to <= pos : node.to < pos)) {
    let parent = !overlays && node instanceof TreeNode && node.index < 0 ? null : node.parent;
    if (!parent)
      return node;
    node = parent;
  }
  let mode = overlays ? 0 : IterMode.IgnoreOverlays;
  if (overlays)
    for (let scan = node, parent = scan.parent; parent; scan = parent, parent = scan.parent) {
      if (scan instanceof TreeNode && scan.index < 0 && ((_a = parent.enter(pos, side, mode)) === null || _a === void 0 ? void 0 : _a.from) != scan.from)
        node = parent;
    }
  for (; ; ) {
    let inner = node.enter(pos, side, mode);
    if (!inner)
      return node;
    node = inner;
  }
}
var BaseNode = class {
  cursor(mode = 0) {
    return new TreeCursor(this, mode);
  }
  getChild(type, before = null, after = null) {
    let r = getChildren(this, type, before, after);
    return r.length ? r[0] : null;
  }
  getChildren(type, before = null, after = null) {
    return getChildren(this, type, before, after);
  }
  resolve(pos, side = 0) {
    return resolveNode(this, pos, side, false);
  }
  resolveInner(pos, side = 0) {
    return resolveNode(this, pos, side, true);
  }
  matchContext(context) {
    return matchNodeContext(this.parent, context);
  }
  enterUnfinishedNodesBefore(pos) {
    let scan = this.childBefore(pos), node = this;
    while (scan) {
      let last = scan.lastChild;
      if (!last || last.to != scan.to)
        break;
      if (last.type.isError && last.from == last.to) {
        node = scan;
        scan = last.prevSibling;
      } else {
        scan = last;
      }
    }
    return node;
  }
  get node() {
    return this;
  }
  get next() {
    return this.parent;
  }
};
var TreeNode = class _TreeNode extends BaseNode {
  constructor(_tree, from, index, _parent) {
    super();
    this._tree = _tree;
    this.from = from;
    this.index = index;
    this._parent = _parent;
  }
  get type() {
    return this._tree.type;
  }
  get name() {
    return this._tree.type.name;
  }
  get to() {
    return this.from + this._tree.length;
  }
  nextChild(i, dir, pos, side, mode = 0) {
    for (let parent = this; ; ) {
      for (let { children, positions } = parent._tree, e = dir > 0 ? children.length : -1; i != e; i += dir) {
        let next = children[i], start = positions[i] + parent.from, mounted;
        if (!(mode & IterMode.EnterBracketed && next instanceof Tree && (mounted = MountedTree.get(next)) && !mounted.overlay && mounted.bracketed && pos >= start && pos <= start + next.length) && !checkSide(side, pos, start, start + next.length))
          continue;
        if (next instanceof TreeBuffer) {
          if (mode & IterMode.ExcludeBuffers)
            continue;
          let index = next.findChild(0, next.buffer.length, dir, pos - start, side);
          if (index > -1)
            return new BufferNode(new BufferContext(parent, next, i, start), null, index);
        } else if (mode & IterMode.IncludeAnonymous || (!next.type.isAnonymous || hasChild(next))) {
          let mounted2;
          if (!(mode & IterMode.IgnoreMounts) && (mounted2 = MountedTree.get(next)) && !mounted2.overlay)
            return new _TreeNode(mounted2.tree, start, i, parent);
          let inner = new _TreeNode(next, start, i, parent);
          return mode & IterMode.IncludeAnonymous || !inner.type.isAnonymous ? inner : inner.nextChild(dir < 0 ? next.children.length - 1 : 0, dir, pos, side, mode);
        }
      }
      if (mode & IterMode.IncludeAnonymous || !parent.type.isAnonymous)
        return null;
      if (parent.index >= 0)
        i = parent.index + dir;
      else
        i = dir < 0 ? -1 : parent._parent._tree.children.length;
      parent = parent._parent;
      if (!parent)
        return null;
    }
  }
  get firstChild() {
    return this.nextChild(
      0,
      1,
      0,
      4
      /* Side.DontCare */
    );
  }
  get lastChild() {
    return this.nextChild(
      this._tree.children.length - 1,
      -1,
      0,
      4
      /* Side.DontCare */
    );
  }
  childAfter(pos) {
    return this.nextChild(
      0,
      1,
      pos,
      2
      /* Side.After */
    );
  }
  childBefore(pos) {
    return this.nextChild(
      this._tree.children.length - 1,
      -1,
      pos,
      -2
      /* Side.Before */
    );
  }
  prop(prop) {
    return this._tree.prop(prop);
  }
  enter(pos, side, mode = 0) {
    let mounted;
    if (!(mode & IterMode.IgnoreOverlays) && (mounted = MountedTree.get(this._tree)) && mounted.overlay) {
      let rPos = pos - this.from, enterBracketed = mode & IterMode.EnterBracketed && mounted.bracketed;
      for (let { from, to } of mounted.overlay) {
        if ((side > 0 || enterBracketed ? from <= rPos : from < rPos) && (side < 0 || enterBracketed ? to >= rPos : to > rPos))
          return new _TreeNode(mounted.tree, mounted.overlay[0].from + this.from, -1, this);
      }
    }
    return this.nextChild(0, 1, pos, side, mode);
  }
  nextSignificantParent() {
    let val = this;
    while (val.type.isAnonymous && val._parent)
      val = val._parent;
    return val;
  }
  get parent() {
    return this._parent ? this._parent.nextSignificantParent() : null;
  }
  get nextSibling() {
    return this._parent && this.index >= 0 ? this._parent.nextChild(
      this.index + 1,
      1,
      0,
      4
      /* Side.DontCare */
    ) : null;
  }
  get prevSibling() {
    return this._parent && this.index >= 0 ? this._parent.nextChild(
      this.index - 1,
      -1,
      0,
      4
      /* Side.DontCare */
    ) : null;
  }
  get tree() {
    return this._tree;
  }
  toTree() {
    return this._tree;
  }
  /**
  @internal
  */
  toString() {
    return this._tree.toString();
  }
};
function getChildren(node, type, before, after) {
  let cur = node.cursor(), result = [];
  if (!cur.firstChild())
    return result;
  if (before != null)
    for (let found = false; !found; ) {
      found = cur.type.is(before);
      if (!cur.nextSibling())
        return result;
    }
  for (; ; ) {
    if (after != null && cur.type.is(after))
      return result;
    if (cur.type.is(type))
      result.push(cur.node);
    if (!cur.nextSibling())
      return after == null ? result : [];
  }
}
function matchNodeContext(node, context, i = context.length - 1) {
  for (let p = node; i >= 0; p = p.parent) {
    if (!p)
      return false;
    if (!p.type.isAnonymous) {
      if (context[i] && context[i] != p.name)
        return false;
      i--;
    }
  }
  return true;
}
var BufferContext = class {
  constructor(parent, buffer, index, start) {
    this.parent = parent;
    this.buffer = buffer;
    this.index = index;
    this.start = start;
  }
};
var BufferNode = class _BufferNode extends BaseNode {
  get name() {
    return this.type.name;
  }
  get from() {
    return this.context.start + this.context.buffer.buffer[this.index + 1];
  }
  get to() {
    return this.context.start + this.context.buffer.buffer[this.index + 2];
  }
  constructor(context, _parent, index) {
    super();
    this.context = context;
    this._parent = _parent;
    this.index = index;
    this.type = context.buffer.set.types[context.buffer.buffer[index]];
  }
  child(dir, pos, side) {
    let { buffer } = this.context;
    let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], dir, pos - this.context.start, side);
    return index < 0 ? null : new _BufferNode(this.context, this, index);
  }
  get firstChild() {
    return this.child(
      1,
      0,
      4
      /* Side.DontCare */
    );
  }
  get lastChild() {
    return this.child(
      -1,
      0,
      4
      /* Side.DontCare */
    );
  }
  childAfter(pos) {
    return this.child(
      1,
      pos,
      2
      /* Side.After */
    );
  }
  childBefore(pos) {
    return this.child(
      -1,
      pos,
      -2
      /* Side.Before */
    );
  }
  prop(prop) {
    return this.type.prop(prop);
  }
  enter(pos, side, mode = 0) {
    if (mode & IterMode.ExcludeBuffers)
      return null;
    let { buffer } = this.context;
    let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], side > 0 ? 1 : -1, pos - this.context.start, side);
    return index < 0 ? null : new _BufferNode(this.context, this, index);
  }
  get parent() {
    return this._parent || this.context.parent.nextSignificantParent();
  }
  externalSibling(dir) {
    return this._parent ? null : this.context.parent.nextChild(
      this.context.index + dir,
      dir,
      0,
      4
      /* Side.DontCare */
    );
  }
  get nextSibling() {
    let { buffer } = this.context;
    let after = buffer.buffer[this.index + 3];
    if (after < (this._parent ? buffer.buffer[this._parent.index + 3] : buffer.buffer.length))
      return new _BufferNode(this.context, this._parent, after);
    return this.externalSibling(1);
  }
  get prevSibling() {
    let { buffer } = this.context;
    let parentStart = this._parent ? this._parent.index + 4 : 0;
    if (this.index == parentStart)
      return this.externalSibling(-1);
    return new _BufferNode(this.context, this._parent, buffer.findChild(
      parentStart,
      this.index,
      -1,
      0,
      4
      /* Side.DontCare */
    ));
  }
  get tree() {
    return null;
  }
  toTree() {
    let children = [], positions = [];
    let { buffer } = this.context;
    let startI = this.index + 4, endI = buffer.buffer[this.index + 3];
    if (endI > startI) {
      let from = buffer.buffer[this.index + 1];
      children.push(buffer.slice(startI, endI, from));
      positions.push(0);
    }
    return new Tree(this.type, children, positions, this.to - this.from);
  }
  /**
  @internal
  */
  toString() {
    return this.context.buffer.childString(this.index);
  }
};
function iterStack(heads) {
  if (!heads.length)
    return null;
  let pick = 0, picked = heads[0];
  for (let i = 1; i < heads.length; i++) {
    let node = heads[i];
    if (node.from > picked.from || node.to < picked.to) {
      picked = node;
      pick = i;
    }
  }
  let next = picked instanceof TreeNode && picked.index < 0 ? null : picked.parent;
  let newHeads = heads.slice();
  if (next)
    newHeads[pick] = next;
  else
    newHeads.splice(pick, 1);
  return new StackIterator(newHeads, picked);
}
var StackIterator = class {
  constructor(heads, node) {
    this.heads = heads;
    this.node = node;
  }
  get next() {
    return iterStack(this.heads);
  }
};
function stackIterator(tree, pos, side) {
  let inner = tree.resolveInner(pos, side), layers = null;
  for (let scan = inner instanceof TreeNode ? inner : inner.context.parent; scan; scan = scan.parent) {
    if (scan.index < 0) {
      let parent = scan.parent;
      (layers || (layers = [inner])).push(parent.resolve(pos, side));
      scan = parent;
    } else {
      let mount = MountedTree.get(scan.tree);
      if (mount && mount.overlay && mount.overlay[0].from <= pos && mount.overlay[mount.overlay.length - 1].to >= pos) {
        let root = new TreeNode(mount.tree, mount.overlay[0].from + scan.from, -1, scan);
        (layers || (layers = [inner])).push(resolveNode(root, pos, side, false));
      }
    }
  }
  return layers ? iterStack(layers) : inner;
}
var TreeCursor = class {
  /**
  Shorthand for `.type.name`.
  */
  get name() {
    return this.type.name;
  }
  /**
  @internal
  */
  constructor(node, mode = 0) {
    this.buffer = null;
    this.stack = [];
    this.index = 0;
    this.bufferNode = null;
    this.mode = mode & ~IterMode.EnterBracketed;
    if (node instanceof TreeNode) {
      this.yieldNode(node);
    } else {
      this._tree = node.context.parent;
      this.buffer = node.context;
      for (let n = node._parent; n; n = n._parent)
        this.stack.unshift(n.index);
      this.bufferNode = node;
      this.yieldBuf(node.index);
    }
  }
  yieldNode(node) {
    if (!node)
      return false;
    this._tree = node;
    this.type = node.type;
    this.from = node.from;
    this.to = node.to;
    return true;
  }
  yieldBuf(index, type) {
    this.index = index;
    let { start, buffer } = this.buffer;
    this.type = type || buffer.set.types[buffer.buffer[index]];
    this.from = start + buffer.buffer[index + 1];
    this.to = start + buffer.buffer[index + 2];
    return true;
  }
  /**
  @internal
  */
  yield(node) {
    if (!node)
      return false;
    if (node instanceof TreeNode) {
      this.buffer = null;
      return this.yieldNode(node);
    }
    this.buffer = node.context;
    return this.yieldBuf(node.index, node.type);
  }
  /**
  @internal
  */
  toString() {
    return this.buffer ? this.buffer.buffer.childString(this.index) : this._tree.toString();
  }
  /**
  @internal
  */
  enterChild(dir, pos, side) {
    if (!this.buffer)
      return this.yield(this._tree.nextChild(dir < 0 ? this._tree._tree.children.length - 1 : 0, dir, pos, side, this.mode));
    let { buffer } = this.buffer;
    let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], dir, pos - this.buffer.start, side);
    if (index < 0)
      return false;
    this.stack.push(this.index);
    return this.yieldBuf(index);
  }
  /**
  Move the cursor to this node's first child. When this returns
  false, the node has no child, and the cursor has not been moved.
  */
  firstChild() {
    return this.enterChild(
      1,
      0,
      4
      /* Side.DontCare */
    );
  }
  /**
  Move the cursor to this node's last child.
  */
  lastChild() {
    return this.enterChild(
      -1,
      0,
      4
      /* Side.DontCare */
    );
  }
  /**
  Move the cursor to the first child that ends after `pos`.
  */
  childAfter(pos) {
    return this.enterChild(
      1,
      pos,
      2
      /* Side.After */
    );
  }
  /**
  Move to the last child that starts before `pos`.
  */
  childBefore(pos) {
    return this.enterChild(
      -1,
      pos,
      -2
      /* Side.Before */
    );
  }
  /**
  Move the cursor to the child around `pos`. If side is -1 the
  child may end at that position, when 1 it may start there. This
  will also enter [overlaid](#common.MountedTree.overlay)
  [mounted](#common.NodeProp^mounted) trees unless `overlays` is
  set to false.
  */
  enter(pos, side, mode = this.mode) {
    if (!this.buffer)
      return this.yield(this._tree.enter(pos, side, mode));
    return mode & IterMode.ExcludeBuffers ? false : this.enterChild(1, pos, side);
  }
  /**
  Move to the node's parent node, if this isn't the top node.
  */
  parent() {
    if (!this.buffer)
      return this.yieldNode(this.mode & IterMode.IncludeAnonymous ? this._tree._parent : this._tree.parent);
    if (this.stack.length)
      return this.yieldBuf(this.stack.pop());
    let parent = this.mode & IterMode.IncludeAnonymous ? this.buffer.parent : this.buffer.parent.nextSignificantParent();
    this.buffer = null;
    return this.yieldNode(parent);
  }
  /**
  @internal
  */
  sibling(dir) {
    if (!this.buffer)
      return !this._tree._parent ? false : this.yield(this._tree.index < 0 ? null : this._tree._parent.nextChild(this._tree.index + dir, dir, 0, 4, this.mode));
    let { buffer } = this.buffer, d = this.stack.length - 1;
    if (dir < 0) {
      let parentStart = d < 0 ? 0 : this.stack[d] + 4;
      if (this.index != parentStart)
        return this.yieldBuf(buffer.findChild(
          parentStart,
          this.index,
          -1,
          0,
          4
          /* Side.DontCare */
        ));
    } else {
      let after = buffer.buffer[this.index + 3];
      if (after < (d < 0 ? buffer.buffer.length : buffer.buffer[this.stack[d] + 3]))
        return this.yieldBuf(after);
    }
    return d < 0 ? this.yield(this.buffer.parent.nextChild(this.buffer.index + dir, dir, 0, 4, this.mode)) : false;
  }
  /**
  Move to this node's next sibling, if any.
  */
  nextSibling() {
    return this.sibling(1);
  }
  /**
  Move to this node's previous sibling, if any.
  */
  prevSibling() {
    return this.sibling(-1);
  }
  atLastNode(dir) {
    let index, parent, { buffer } = this;
    if (buffer) {
      if (dir > 0) {
        if (this.index < buffer.buffer.buffer.length)
          return false;
      } else {
        for (let i = 0; i < this.index; i++)
          if (buffer.buffer.buffer[i + 3] < this.index)
            return false;
      }
      ({ index, parent } = buffer);
    } else {
      ({ index, _parent: parent } = this._tree);
    }
    for (; parent; { index, _parent: parent } = parent) {
      if (index > -1)
        for (let i = index + dir, e = dir < 0 ? -1 : parent._tree.children.length; i != e; i += dir) {
          let child = parent._tree.children[i];
          if (this.mode & IterMode.IncludeAnonymous || child instanceof TreeBuffer || !child.type.isAnonymous || hasChild(child))
            return false;
        }
    }
    return true;
  }
  move(dir, enter) {
    if (enter && this.enterChild(
      dir,
      0,
      4
      /* Side.DontCare */
    ))
      return true;
    for (; ; ) {
      if (this.sibling(dir))
        return true;
      if (this.atLastNode(dir) || !this.parent())
        return false;
    }
  }
  /**
  Move to the next node in a
  [pre-order](https://en.wikipedia.org/wiki/Tree_traversal#Pre-order,_NLR)
  traversal, going from a node to its first child or, if the
  current node is empty or `enter` is false, its next sibling or
  the next sibling of the first parent node that has one.
  */
  next(enter = true) {
    return this.move(1, enter);
  }
  /**
  Move to the next node in a last-to-first pre-order traversal. A
  node is followed by its last child or, if it has none, its
  previous sibling or the previous sibling of the first parent
  node that has one.
  */
  prev(enter = true) {
    return this.move(-1, enter);
  }
  /**
  Move the cursor to the innermost node that covers `pos`. If
  `side` is -1, it will enter nodes that end at `pos`. If it is 1,
  it will enter nodes that start at `pos`.
  */
  moveTo(pos, side = 0) {
    while (this.from == this.to || (side < 1 ? this.from >= pos : this.from > pos) || (side > -1 ? this.to <= pos : this.to < pos))
      if (!this.parent())
        break;
    while (this.enterChild(1, pos, side)) {
    }
    return this;
  }
  /**
  Get a [syntax node](#common.SyntaxNode) at the cursor's current
  position.
  */
  get node() {
    if (!this.buffer)
      return this._tree;
    let cache = this.bufferNode, result = null, depth = 0;
    if (cache && cache.context == this.buffer) {
      scan: for (let index = this.index, d = this.stack.length; d >= 0; ) {
        for (let c = cache; c; c = c._parent)
          if (c.index == index) {
            if (index == this.index)
              return c;
            result = c;
            depth = d + 1;
            break scan;
          }
        index = this.stack[--d];
      }
    }
    for (let i = depth; i < this.stack.length; i++)
      result = new BufferNode(this.buffer, result, this.stack[i]);
    return this.bufferNode = new BufferNode(this.buffer, result, this.index);
  }
  /**
  Get the [tree](#common.Tree) that represents the current node, if
  any. Will return null when the node is in a [tree
  buffer](#common.TreeBuffer).
  */
  get tree() {
    return this.buffer ? null : this._tree._tree;
  }
  /**
  Iterate over the current node and all its descendants, calling
  `enter` when entering a node and `leave`, if given, when leaving
  one. When `enter` returns `false`, any children of that node are
  skipped, and `leave` isn't called for it.
  */
  iterate(enter, leave) {
    for (let depth = 0; ; ) {
      let mustLeave = false;
      if (this.type.isAnonymous || enter(this) !== false) {
        if (this.firstChild()) {
          depth++;
          continue;
        }
        if (!this.type.isAnonymous)
          mustLeave = true;
      }
      for (; ; ) {
        if (mustLeave && leave)
          leave(this);
        mustLeave = this.type.isAnonymous;
        if (!depth)
          return;
        if (this.nextSibling())
          break;
        this.parent();
        depth--;
        mustLeave = true;
      }
    }
  }
  /**
  Test whether the current node matches a given context—a sequence
  of direct parent node names. Empty strings in the context array
  are treated as wildcards.
  */
  matchContext(context) {
    if (!this.buffer)
      return matchNodeContext(this.node.parent, context);
    let { buffer } = this.buffer, { types } = buffer.set;
    for (let i = context.length - 1, d = this.stack.length - 1; i >= 0; d--) {
      if (d < 0)
        return matchNodeContext(this._tree, context, i);
      let type = types[buffer.buffer[this.stack[d]]];
      if (!type.isAnonymous) {
        if (context[i] && context[i] != type.name)
          return false;
        i--;
      }
    }
    return true;
  }
};
function hasChild(tree) {
  return tree.children.some((ch) => ch instanceof TreeBuffer || !ch.type.isAnonymous || hasChild(ch));
}
function buildTree(data) {
  var _a;
  let { buffer, nodeSet, maxBufferLength = DefaultBufferLength, reused = [], minRepeatType = nodeSet.types.length } = data;
  let cursor = Array.isArray(buffer) ? new FlatBufferCursor(buffer, buffer.length) : buffer;
  let types = nodeSet.types;
  let contextHash = 0, lookAhead = 0;
  function takeNode(parentStart, minPos, children2, positions2, inRepeat, depth) {
    let { id, start, end, size } = cursor;
    let lookAheadAtStart = lookAhead, contextAtStart = contextHash;
    if (size < 0) {
      cursor.next();
      if (size == -1) {
        let node2 = reused[id];
        children2.push(node2);
        positions2.push(start - parentStart);
        return;
      } else if (size == -3) {
        contextHash = id;
        return;
      } else if (size == -4) {
        lookAhead = id;
        return;
      } else {
        throw new RangeError(`Unrecognized record size: ${size}`);
      }
    }
    let type = types[id], node, buffer2;
    let startPos = start - parentStart;
    if (end - start <= maxBufferLength && (buffer2 = findBufferSize(cursor.pos - minPos, inRepeat))) {
      let data2 = new Uint16Array(buffer2.size - buffer2.skip);
      let endPos = cursor.pos - buffer2.size, index = data2.length;
      while (cursor.pos > endPos)
        index = copyToBuffer(buffer2.start, data2, index);
      node = new TreeBuffer(data2, end - buffer2.start, nodeSet);
      startPos = buffer2.start - parentStart;
    } else {
      let endPos = cursor.pos - size;
      cursor.next();
      let localChildren = [], localPositions = [];
      let localInRepeat = id >= minRepeatType ? id : -1;
      let lastGroup = 0, lastEnd = end;
      while (cursor.pos > endPos) {
        if (localInRepeat >= 0 && cursor.id == localInRepeat && cursor.size >= 0) {
          if (cursor.end <= lastEnd - maxBufferLength) {
            makeRepeatLeaf(localChildren, localPositions, start, lastGroup, cursor.end, lastEnd, localInRepeat, lookAheadAtStart, contextAtStart);
            lastGroup = localChildren.length;
            lastEnd = cursor.end;
          }
          cursor.next();
        } else if (depth > 2500) {
          takeFlatNode(start, endPos, localChildren, localPositions);
        } else {
          takeNode(start, endPos, localChildren, localPositions, localInRepeat, depth + 1);
        }
      }
      if (localInRepeat >= 0 && lastGroup > 0 && lastGroup < localChildren.length)
        makeRepeatLeaf(localChildren, localPositions, start, lastGroup, start, lastEnd, localInRepeat, lookAheadAtStart, contextAtStart);
      localChildren.reverse();
      localPositions.reverse();
      if (localInRepeat > -1 && lastGroup > 0) {
        let make = makeBalanced(type, contextAtStart);
        node = balanceRange(type, localChildren, localPositions, 0, localChildren.length, 0, end - start, make, make);
      } else {
        node = makeTree(type, localChildren, localPositions, end - start, lookAheadAtStart - end, contextAtStart);
      }
    }
    children2.push(node);
    positions2.push(startPos);
  }
  function takeFlatNode(parentStart, minPos, children2, positions2) {
    let nodes = [];
    let nodeCount = 0, stopAt = -1;
    while (cursor.pos > minPos) {
      let { id, start, end, size } = cursor;
      if (size > 4) {
        cursor.next();
      } else if (stopAt > -1 && start < stopAt) {
        break;
      } else {
        if (stopAt < 0)
          stopAt = end - maxBufferLength;
        nodes.push(id, start, end);
        nodeCount++;
        cursor.next();
      }
    }
    if (nodeCount) {
      let buffer2 = new Uint16Array(nodeCount * 4);
      let start = nodes[nodes.length - 2];
      for (let i = nodes.length - 3, j = 0; i >= 0; i -= 3) {
        buffer2[j++] = nodes[i];
        buffer2[j++] = nodes[i + 1] - start;
        buffer2[j++] = nodes[i + 2] - start;
        buffer2[j++] = j;
      }
      children2.push(new TreeBuffer(buffer2, nodes[2] - start, nodeSet));
      positions2.push(start - parentStart);
    }
  }
  function makeBalanced(type, contextHash2) {
    return (children2, positions2, length2) => {
      let lookAhead2 = 0, lastI = children2.length - 1, last, lookAheadProp;
      if (lastI >= 0 && (last = children2[lastI]) instanceof Tree) {
        if (!lastI && last.type == type && last.length == length2)
          return last;
        if (lookAheadProp = last.prop(NodeProp.lookAhead))
          lookAhead2 = positions2[lastI] + last.length + lookAheadProp;
      }
      return makeTree(type, children2, positions2, length2, lookAhead2, contextHash2);
    };
  }
  function makeRepeatLeaf(children2, positions2, base, i, from, to, type, lookAhead2, contextHash2) {
    let localChildren = [], localPositions = [];
    while (children2.length > i) {
      localChildren.push(children2.pop());
      localPositions.push(positions2.pop() + base - from);
    }
    children2.push(makeTree(nodeSet.types[type], localChildren, localPositions, to - from, lookAhead2 - to, contextHash2));
    positions2.push(from - base);
  }
  function makeTree(type, children2, positions2, length2, lookAhead2, contextHash2, props) {
    if (contextHash2) {
      let pair = [NodeProp.contextHash, contextHash2];
      props = props ? [pair].concat(props) : [pair];
    }
    if (lookAhead2 > 25) {
      let pair = [NodeProp.lookAhead, lookAhead2];
      props = props ? [pair].concat(props) : [pair];
    }
    return new Tree(type, children2, positions2, length2, props);
  }
  function findBufferSize(maxSize, inRepeat) {
    let fork = cursor.fork();
    let size = 0, start = 0, skip = 0, minStart = fork.end - maxBufferLength;
    let result = { size: 0, start: 0, skip: 0 };
    scan: for (let minPos = fork.pos - maxSize; fork.pos > minPos; ) {
      let nodeSize2 = fork.size;
      if (fork.id == inRepeat && nodeSize2 >= 0) {
        result.size = size;
        result.start = start;
        result.skip = skip;
        skip += 4;
        size += 4;
        fork.next();
        continue;
      }
      let startPos = fork.pos - nodeSize2;
      if (nodeSize2 < 0 || startPos < minPos || fork.start < minStart)
        break;
      let localSkipped = fork.id >= minRepeatType ? 4 : 0;
      let nodeStart = fork.start;
      fork.next();
      while (fork.pos > startPos) {
        if (fork.size < 0) {
          if (fork.size == -3 || fork.size == -4)
            localSkipped += 4;
          else
            break scan;
        } else if (fork.id >= minRepeatType) {
          localSkipped += 4;
        }
        fork.next();
      }
      start = nodeStart;
      size += nodeSize2;
      skip += localSkipped;
    }
    if (inRepeat < 0 || size == maxSize) {
      result.size = size;
      result.start = start;
      result.skip = skip;
    }
    return result.size > 4 ? result : void 0;
  }
  function copyToBuffer(bufferStart, buffer2, index) {
    let { id, start, end, size } = cursor;
    cursor.next();
    if (size >= 0 && id < minRepeatType) {
      let startIndex = index;
      if (size > 4) {
        let endPos = cursor.pos - (size - 4);
        while (cursor.pos > endPos)
          index = copyToBuffer(bufferStart, buffer2, index);
      }
      buffer2[--index] = startIndex;
      buffer2[--index] = end - bufferStart;
      buffer2[--index] = start - bufferStart;
      buffer2[--index] = id;
    } else if (size == -3) {
      contextHash = id;
    } else if (size == -4) {
      lookAhead = id;
    }
    return index;
  }
  let children = [], positions = [];
  while (cursor.pos > 0)
    takeNode(data.start || 0, data.bufferStart || 0, children, positions, -1, 0);
  let length = (_a = data.length) !== null && _a !== void 0 ? _a : children.length ? positions[0] + children[0].length : 0;
  return new Tree(types[data.topID], children.reverse(), positions.reverse(), length);
}
var nodeSizeCache = /* @__PURE__ */ new WeakMap();
function nodeSize(balanceType, node) {
  if (!balanceType.isAnonymous || node instanceof TreeBuffer || node.type != balanceType)
    return 1;
  let size = nodeSizeCache.get(node);
  if (size == null) {
    size = 1;
    for (let child of node.children) {
      if (child.type != balanceType || !(child instanceof Tree)) {
        size = 1;
        break;
      }
      size += nodeSize(balanceType, child);
    }
    nodeSizeCache.set(node, size);
  }
  return size;
}
function balanceRange(balanceType, children, positions, from, to, start, length, mkTop, mkTree) {
  let total = 0;
  for (let i = from; i < to; i++)
    total += nodeSize(balanceType, children[i]);
  let maxChild = Math.ceil(
    total * 1.5 / 8
    /* Balance.BranchFactor */
  );
  let localChildren = [], localPositions = [];
  function divide(children2, positions2, from2, to2, offset) {
    for (let i = from2; i < to2; ) {
      let groupFrom = i, groupStart = positions2[i], groupSize = nodeSize(balanceType, children2[i]);
      i++;
      for (; i < to2; i++) {
        let nextSize = nodeSize(balanceType, children2[i]);
        if (groupSize + nextSize >= maxChild)
          break;
        groupSize += nextSize;
      }
      if (i == groupFrom + 1) {
        if (groupSize > maxChild) {
          let only = children2[groupFrom];
          divide(only.children, only.positions, 0, only.children.length, positions2[groupFrom] + offset);
          continue;
        }
        localChildren.push(children2[groupFrom]);
      } else {
        let length2 = positions2[i - 1] + children2[i - 1].length - groupStart;
        localChildren.push(balanceRange(balanceType, children2, positions2, groupFrom, i, groupStart, length2, null, mkTree));
      }
      localPositions.push(groupStart + offset - start);
    }
  }
  divide(children, positions, from, to, 0);
  return (mkTop || mkTree)(localChildren, localPositions, length);
}
var stoppedInner = new NodeProp({ perNode: true });

// ../../node_modules/@lezer/highlight/dist/index.js
var nextTagID = 0;
var Tag = class _Tag {
  /**
  @internal
  */
  constructor(name2, set, base, modified) {
    this.name = name2;
    this.set = set;
    this.base = base;
    this.modified = modified;
    this.id = nextTagID++;
  }
  toString() {
    let { name: name2 } = this;
    for (let mod of this.modified)
      if (mod.name)
        name2 = `${mod.name}(${name2})`;
    return name2;
  }
  static define(nameOrParent, parent) {
    let name2 = typeof nameOrParent == "string" ? nameOrParent : "?";
    if (nameOrParent instanceof _Tag)
      parent = nameOrParent;
    if (parent === null || parent === void 0 ? void 0 : parent.base)
      throw new Error("Can not derive from a modified tag");
    let tag = new _Tag(name2, [], null, []);
    tag.set.push(tag);
    if (parent)
      for (let t2 of parent.set)
        tag.set.push(t2);
    return tag;
  }
  /**
  Define a tag _modifier_, which is a function that, given a tag,
  will return a tag that is a subtag of the original. Applying the
  same modifier to a twice tag will return the same value (`m1(t1)
  == m1(t1)`) and applying multiple modifiers will, regardless or
  order, produce the same tag (`m1(m2(t1)) == m2(m1(t1))`).
  
  When multiple modifiers are applied to a given base tag, each
  smaller set of modifiers is registered as a parent, so that for
  example `m1(m2(m3(t1)))` is a subtype of `m1(m2(t1))`,
  `m1(m3(t1)`, and so on.
  */
  static defineModifier(name2) {
    let mod = new Modifier(name2);
    return (tag) => {
      if (tag.modified.indexOf(mod) > -1)
        return tag;
      return Modifier.get(tag.base || tag, tag.modified.concat(mod).sort((a, b) => a.id - b.id));
    };
  }
};
var nextModifierID = 0;
var Modifier = class _Modifier {
  constructor(name2) {
    this.name = name2;
    this.instances = [];
    this.id = nextModifierID++;
  }
  static get(base, mods) {
    if (!mods.length)
      return base;
    let exists = mods[0].instances.find((t2) => t2.base == base && sameArray(mods, t2.modified));
    if (exists)
      return exists;
    let set = [], tag = new Tag(base.name, set, base, mods);
    for (let m of mods)
      m.instances.push(tag);
    let configs = powerSet(mods);
    for (let parent of base.set)
      if (!parent.modified.length)
        for (let config of configs)
          set.push(_Modifier.get(parent, config));
    return tag;
  }
};
function sameArray(a, b) {
  return a.length == b.length && a.every((x, i) => x == b[i]);
}
function powerSet(array) {
  let sets = [[]];
  for (let i = 0; i < array.length; i++) {
    for (let j = 0, e = sets.length; j < e; j++) {
      sets.push(sets[j].concat(array[i]));
    }
  }
  return sets.sort((a, b) => b.length - a.length);
}
var ruleNodeProp = new NodeProp({
  combine(a, b) {
    let cur, root, take;
    while (a || b) {
      if (!a || b && a.depth >= b.depth) {
        take = b;
        b = b.next;
      } else {
        take = a;
        a = a.next;
      }
      if (cur && cur.mode == take.mode && !take.context && !cur.context)
        continue;
      let copy = new Rule(take.tags, take.mode, take.context);
      if (cur)
        cur.next = copy;
      else
        root = copy;
      cur = copy;
    }
    return root;
  }
});
var Rule = class {
  constructor(tags2, mode, context, next) {
    this.tags = tags2;
    this.mode = mode;
    this.context = context;
    this.next = next;
  }
  get opaque() {
    return this.mode == 0;
  }
  get inherit() {
    return this.mode == 1;
  }
  sort(other) {
    if (!other || other.depth < this.depth) {
      this.next = other;
      return this;
    }
    other.next = this.sort(other.next);
    return other;
  }
  get depth() {
    return this.context ? this.context.length : 0;
  }
};
Rule.empty = new Rule([], 2, null);
function tagHighlighter(tags2, options) {
  let map = /* @__PURE__ */ Object.create(null);
  for (let style of tags2) {
    if (!Array.isArray(style.tag))
      map[style.tag.id] = style.class;
    else
      for (let tag of style.tag)
        map[tag.id] = style.class;
  }
  let { scope, all = null } = options || {};
  return {
    style: (tags3) => {
      let cls = all;
      for (let tag of tags3) {
        for (let sub of tag.set) {
          let tagClass = map[sub.id];
          if (tagClass) {
            cls = cls ? cls + " " + tagClass : tagClass;
            break;
          }
        }
      }
      return cls;
    },
    scope
  };
}
var t = Tag.define;
var comment = t();
var name = t();
var typeName = t(name);
var propertyName = t(name);
var literal = t();
var string = t(literal);
var number = t(literal);
var content = t();
var heading = t(content);
var keyword = t();
var operator = t();
var punctuation = t();
var bracket = t(punctuation);
var meta = t();
var tags = {
  /**
  A comment.
  */
  comment,
  /**
  A line [comment](#highlight.tags.comment).
  */
  lineComment: t(comment),
  /**
  A block [comment](#highlight.tags.comment).
  */
  blockComment: t(comment),
  /**
  A documentation [comment](#highlight.tags.comment).
  */
  docComment: t(comment),
  /**
  Any kind of identifier.
  */
  name,
  /**
  The [name](#highlight.tags.name) of a variable.
  */
  variableName: t(name),
  /**
  A type [name](#highlight.tags.name).
  */
  typeName,
  /**
  A tag name (subtag of [`typeName`](#highlight.tags.typeName)).
  */
  tagName: t(typeName),
  /**
  A property or field [name](#highlight.tags.name).
  */
  propertyName,
  /**
  An attribute name (subtag of [`propertyName`](#highlight.tags.propertyName)).
  */
  attributeName: t(propertyName),
  /**
  The [name](#highlight.tags.name) of a class.
  */
  className: t(name),
  /**
  A label [name](#highlight.tags.name).
  */
  labelName: t(name),
  /**
  A namespace [name](#highlight.tags.name).
  */
  namespace: t(name),
  /**
  The [name](#highlight.tags.name) of a macro.
  */
  macroName: t(name),
  /**
  A literal value.
  */
  literal,
  /**
  A string [literal](#highlight.tags.literal).
  */
  string,
  /**
  A documentation [string](#highlight.tags.string).
  */
  docString: t(string),
  /**
  A character literal (subtag of [string](#highlight.tags.string)).
  */
  character: t(string),
  /**
  An attribute value (subtag of [string](#highlight.tags.string)).
  */
  attributeValue: t(string),
  /**
  A number [literal](#highlight.tags.literal).
  */
  number,
  /**
  An integer [number](#highlight.tags.number) literal.
  */
  integer: t(number),
  /**
  A floating-point [number](#highlight.tags.number) literal.
  */
  float: t(number),
  /**
  A boolean [literal](#highlight.tags.literal).
  */
  bool: t(literal),
  /**
  Regular expression [literal](#highlight.tags.literal).
  */
  regexp: t(literal),
  /**
  An escape [literal](#highlight.tags.literal), for example a
  backslash escape in a string.
  */
  escape: t(literal),
  /**
  A color [literal](#highlight.tags.literal).
  */
  color: t(literal),
  /**
  A URL [literal](#highlight.tags.literal).
  */
  url: t(literal),
  /**
  A language keyword.
  */
  keyword,
  /**
  The [keyword](#highlight.tags.keyword) for the self or this
  object.
  */
  self: t(keyword),
  /**
  The [keyword](#highlight.tags.keyword) for null.
  */
  null: t(keyword),
  /**
  A [keyword](#highlight.tags.keyword) denoting some atomic value.
  */
  atom: t(keyword),
  /**
  A [keyword](#highlight.tags.keyword) that represents a unit.
  */
  unit: t(keyword),
  /**
  A modifier [keyword](#highlight.tags.keyword).
  */
  modifier: t(keyword),
  /**
  A [keyword](#highlight.tags.keyword) that acts as an operator.
  */
  operatorKeyword: t(keyword),
  /**
  A control-flow related [keyword](#highlight.tags.keyword).
  */
  controlKeyword: t(keyword),
  /**
  A [keyword](#highlight.tags.keyword) that defines something.
  */
  definitionKeyword: t(keyword),
  /**
  A [keyword](#highlight.tags.keyword) related to defining or
  interfacing with modules.
  */
  moduleKeyword: t(keyword),
  /**
  An operator.
  */
  operator,
  /**
  An [operator](#highlight.tags.operator) that dereferences something.
  */
  derefOperator: t(operator),
  /**
  Arithmetic-related [operator](#highlight.tags.operator).
  */
  arithmeticOperator: t(operator),
  /**
  Logical [operator](#highlight.tags.operator).
  */
  logicOperator: t(operator),
  /**
  Bit [operator](#highlight.tags.operator).
  */
  bitwiseOperator: t(operator),
  /**
  Comparison [operator](#highlight.tags.operator).
  */
  compareOperator: t(operator),
  /**
  [Operator](#highlight.tags.operator) that updates its operand.
  */
  updateOperator: t(operator),
  /**
  [Operator](#highlight.tags.operator) that defines something.
  */
  definitionOperator: t(operator),
  /**
  Type-related [operator](#highlight.tags.operator).
  */
  typeOperator: t(operator),
  /**
  Control-flow [operator](#highlight.tags.operator).
  */
  controlOperator: t(operator),
  /**
  Program or markup punctuation.
  */
  punctuation,
  /**
  [Punctuation](#highlight.tags.punctuation) that separates
  things.
  */
  separator: t(punctuation),
  /**
  Bracket-style [punctuation](#highlight.tags.punctuation).
  */
  bracket,
  /**
  Angle [brackets](#highlight.tags.bracket) (usually `<` and `>`
  tokens).
  */
  angleBracket: t(bracket),
  /**
  Square [brackets](#highlight.tags.bracket) (usually `[` and `]`
  tokens).
  */
  squareBracket: t(bracket),
  /**
  Parentheses (usually `(` and `)` tokens). Subtag of
  [bracket](#highlight.tags.bracket).
  */
  paren: t(bracket),
  /**
  Braces (usually `{` and `}` tokens). Subtag of
  [bracket](#highlight.tags.bracket).
  */
  brace: t(bracket),
  /**
  Content, for example plain text in XML or markup documents.
  */
  content,
  /**
  [Content](#highlight.tags.content) that represents a heading.
  */
  heading,
  /**
  A level 1 [heading](#highlight.tags.heading).
  */
  heading1: t(heading),
  /**
  A level 2 [heading](#highlight.tags.heading).
  */
  heading2: t(heading),
  /**
  A level 3 [heading](#highlight.tags.heading).
  */
  heading3: t(heading),
  /**
  A level 4 [heading](#highlight.tags.heading).
  */
  heading4: t(heading),
  /**
  A level 5 [heading](#highlight.tags.heading).
  */
  heading5: t(heading),
  /**
  A level 6 [heading](#highlight.tags.heading).
  */
  heading6: t(heading),
  /**
  A prose [content](#highlight.tags.content) separator (such as a horizontal rule).
  */
  contentSeparator: t(content),
  /**
  [Content](#highlight.tags.content) that represents a list.
  */
  list: t(content),
  /**
  [Content](#highlight.tags.content) that represents a quote.
  */
  quote: t(content),
  /**
  [Content](#highlight.tags.content) that is emphasized.
  */
  emphasis: t(content),
  /**
  [Content](#highlight.tags.content) that is styled strong.
  */
  strong: t(content),
  /**
  [Content](#highlight.tags.content) that is part of a link.
  */
  link: t(content),
  /**
  [Content](#highlight.tags.content) that is styled as code or
  monospace.
  */
  monospace: t(content),
  /**
  [Content](#highlight.tags.content) that has a strike-through
  style.
  */
  strikethrough: t(content),
  /**
  Inserted text in a change-tracking format.
  */
  inserted: t(),
  /**
  Deleted text.
  */
  deleted: t(),
  /**
  Changed text.
  */
  changed: t(),
  /**
  An invalid or unsyntactic element.
  */
  invalid: t(),
  /**
  Metadata or meta-instruction.
  */
  meta,
  /**
  [Metadata](#highlight.tags.meta) that applies to the entire
  document.
  */
  documentMeta: t(meta),
  /**
  [Metadata](#highlight.tags.meta) that annotates or adds
  attributes to a given syntactic element.
  */
  annotation: t(meta),
  /**
  Processing instruction or preprocessor directive. Subtag of
  [meta](#highlight.tags.meta).
  */
  processingInstruction: t(meta),
  /**
  [Modifier](#highlight.Tag^defineModifier) that indicates that a
  given element is being defined. Expected to be used with the
  various [name](#highlight.tags.name) tags.
  */
  definition: Tag.defineModifier("definition"),
  /**
  [Modifier](#highlight.Tag^defineModifier) that indicates that
  something is constant. Mostly expected to be used with
  [variable names](#highlight.tags.variableName).
  */
  constant: Tag.defineModifier("constant"),
  /**
  [Modifier](#highlight.Tag^defineModifier) used to indicate that
  a [variable](#highlight.tags.variableName) or [property
  name](#highlight.tags.propertyName) is being called or defined
  as a function.
  */
  function: Tag.defineModifier("function"),
  /**
  [Modifier](#highlight.Tag^defineModifier) that can be applied to
  [names](#highlight.tags.name) to indicate that they belong to
  the language's standard environment.
  */
  standard: Tag.defineModifier("standard"),
  /**
  [Modifier](#highlight.Tag^defineModifier) that indicates a given
  [names](#highlight.tags.name) is local to some scope.
  */
  local: Tag.defineModifier("local"),
  /**
  A generic variant [modifier](#highlight.Tag^defineModifier) that
  can be used to tag language-specific alternative variants of
  some common tag. It is recommended for themes to define special
  forms of at least the [string](#highlight.tags.string) and
  [variable name](#highlight.tags.variableName) tags, since those
  come up a lot.
  */
  special: Tag.defineModifier("special")
};
for (let name2 in tags) {
  let val = tags[name2];
  if (val instanceof Tag)
    val.name = name2;
}
var classHighlighter = tagHighlighter([
  { tag: tags.link, class: "tok-link" },
  { tag: tags.heading, class: "tok-heading" },
  { tag: tags.emphasis, class: "tok-emphasis" },
  { tag: tags.strong, class: "tok-strong" },
  { tag: tags.keyword, class: "tok-keyword" },
  { tag: tags.atom, class: "tok-atom" },
  { tag: tags.bool, class: "tok-bool" },
  { tag: tags.url, class: "tok-url" },
  { tag: tags.labelName, class: "tok-labelName" },
  { tag: tags.inserted, class: "tok-inserted" },
  { tag: tags.deleted, class: "tok-deleted" },
  { tag: tags.literal, class: "tok-literal" },
  { tag: tags.string, class: "tok-string" },
  { tag: tags.number, class: "tok-number" },
  { tag: [tags.regexp, tags.escape, tags.special(tags.string)], class: "tok-string2" },
  { tag: tags.variableName, class: "tok-variableName" },
  { tag: tags.local(tags.variableName), class: "tok-variableName tok-local" },
  { tag: tags.definition(tags.variableName), class: "tok-variableName tok-definition" },
  { tag: tags.special(tags.variableName), class: "tok-variableName2" },
  { tag: tags.definition(tags.propertyName), class: "tok-propertyName tok-definition" },
  { tag: tags.typeName, class: "tok-typeName" },
  { tag: tags.namespace, class: "tok-namespace" },
  { tag: tags.className, class: "tok-className" },
  { tag: tags.macroName, class: "tok-macroName" },
  { tag: tags.propertyName, class: "tok-propertyName" },
  { tag: tags.operator, class: "tok-operator" },
  { tag: tags.comment, class: "tok-comment" },
  { tag: tags.meta, class: "tok-meta" },
  { tag: tags.invalid, class: "tok-invalid" },
  { tag: tags.punctuation, class: "tok-punctuation" }
]);

// src/parser.js
var ExpandEmbedShortcode = {
  defineNodes: [
    { name: "ExpandEmbedShortcode" },
    { name: "ExpandEmbedTagName", style: tags.className },
    { name: "ExpandEmbedAttribute", style: tags.propertyName },
    { name: "ExpandEmbedAttributeName", style: tags.propertyName },
    { name: "ExpandEmbedAttributeValue", style: tags.string },
    { name: "ExpandEmbedMark", style: tags.processingInstruction }
  ],
  parseInline: [
    {
      name: "ExpandEmbedShortcode",
      before: "Link",
      parse(cx, next, pos) {
        if (next !== 91) return -1;
        const slice = cx.slice(pos + 1, pos + 10);
        let tagName = "";
        if (slice.startsWith("expand")) tagName = "expand";
        else if (slice.startsWith("embed")) tagName = "embed";
        else return -1;
        const nextChar = cx.char(pos + 1 + tagName.length);
        if (nextChar !== 32 && nextChar !== 93 && nextChar !== 61) return -1;
        let scan = pos + 1 + tagName.length;
        let endPos = -1;
        let inDoubleQuote = false;
        let inSingleQuote = false;
        while (scan < cx.end) {
          const ch = cx.char(scan);
          if (ch === 10) break;
          if (ch === 34 && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
          else if (ch === 39 && !inDoubleQuote) inSingleQuote = !inSingleQuote;
          else if (ch === 93 && !inDoubleQuote && !inSingleQuote) {
            endPos = scan + 1;
            break;
          }
          scan++;
        }
        if (endPos === -1) return -1;
        const children = [];
        children.push(cx.elt("ExpandEmbedMark", pos, pos + 1));
        children.push(
          cx.elt("ExpandEmbedTagName", pos + 1, pos + 1 + tagName.length)
        );
        const attrStart = pos + 1 + tagName.length;
        const attrEnd = endPos - 1;
        const attrStr = cx.slice(attrStart, attrEnd);
        const shorthand = attrStr.match(/^\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+))/);
        if (shorthand) {
          const valStr = shorthand[1] ?? shorthand[2] ?? shorthand[3] ?? "";
          const matchStart = attrStart + (shorthand.index || 0);
          const eqIdx = shorthand[0].indexOf("=");
          const valIdxInMatch = shorthand[0].indexOf(valStr, eqIdx);
          const valStart = matchStart + Math.max(0, valIdxInMatch);
          const valEnd = valStart + valStr.length;
          children.push(
            cx.elt("ExpandEmbedAttribute", matchStart, matchStart + shorthand[0].length, [
              cx.elt("ExpandEmbedAttributeValue", valStart, valEnd)
            ])
          );
        }
        const attrRegex = /\s*([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+))/g;
        let match;
        while ((match = attrRegex.exec(attrStr)) !== null) {
          if (shorthand && match.index < shorthand[0].length) continue;
          const matchStart = attrStart + match.index;
          const matchEnd = attrStart + attrRegex.lastIndex;
          const nameStr = match[1];
          const nameStart = matchStart + match[0].indexOf(nameStr);
          const nameEnd = nameStart + nameStr.length;
          const valStr = match[2] !== void 0 ? match[2] : match[3] !== void 0 ? match[3] : match[4] || "";
          const eqIdx = match[0].indexOf("=");
          const valIdxInMatch = match[0].indexOf(valStr, eqIdx);
          const valStart = matchStart + valIdxInMatch;
          const valEnd = valStart + valStr.length;
          children.push(
            cx.elt("ExpandEmbedAttribute", matchStart, matchEnd, [
              cx.elt("ExpandEmbedAttributeName", nameStart, nameEnd),
              cx.elt("ExpandEmbedAttributeValue", valStart, valEnd)
            ])
          );
        }
        children.push(cx.elt("ExpandEmbedMark", endPos - 1, endPos));
        cx.addElement(cx.elt("ExpandEmbedShortcode", pos, endPos, children));
        return endPos;
      }
    }
  ]
};
function expandEmbedLabel(attrs) {
  const text = String(attrs?.text || "").trim();
  if (text) return text;
  const heading2 = String(attrs?.heading || "").trim();
  if (heading2) return heading2;
  const slug = String(attrs?.slug || "").trim();
  return slug || "(missing slug)";
}
function parseExpandEmbedAttrs(raw) {
  const text = String(raw || "").trim();
  const mode = text.startsWith("[embed") ? "embed" : "expand";
  const attrs = {};
  const shorthand = text.match(/\[(?:expand|embed)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+))/i);
  if (shorthand) {
    attrs.default = shorthand[1] ?? shorthand[2] ?? shorthand[3] ?? "";
  }
  const attrRegex = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+))/g;
  let m;
  while ((m = attrRegex.exec(text)) !== null) {
    attrs[m[1]] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  let slug = (attrs.slug || attrs.default || "").trim();
  let heading2 = (attrs.heading || "").trim() || null;
  const linkText = (attrs.text || "").trim() || null;
  const source = (attrs.source || "").trim() || null;
  if (slug.includes("#") && !heading2) {
    const parts = slug.split("#");
    slug = parts[0];
    heading2 = parts.slice(1).join("#") || null;
  }
  return { mode, slug, heading: heading2, text: linkText, source };
}

// src/plugin.js
var expandIdCounter = 0;
function nextExpandId() {
  expandIdCounter += 1;
  return `traven-ee-${expandIdCounter}`;
}
var ExpandEmbedWidget = class _ExpandEmbedWidget extends WidgetType {
  /**
   * @param {{ mode: string, slug: string, heading: string|null, text: string|null, rawText: string, nodeFrom: number }} opts
   */
  constructor(opts) {
    super();
    this.mode = opts.mode;
    this.slug = opts.slug;
    this.heading = opts.heading;
    this.text = opts.text;
    this.rawText = opts.rawText;
    this.nodeFrom = opts.nodeFrom;
  }
  toDOM(view) {
    const el = document.createElement("span");
    el.className = `traven-expand-chip traven-expand-chip--${this.mode}`;
    el.dataset.mode = this.mode;
    el.title = this.rawText;
    el.textContent = expandEmbedLabel({
      text: this.text,
      heading: this.heading,
      slug: this.slug
    });
    el.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      view.dispatch({ selection: { anchor: this.nodeFrom } });
      view.focus();
    });
    return el;
  }
  eq(other) {
    return other instanceof _ExpandEmbedWidget && other.mode === this.mode && other.slug === this.slug && other.heading === this.heading && other.text === this.text && other.rawText === this.rawText;
  }
  ignoreEvent() {
    return false;
  }
};
var ExpandEmbedPlugin = class extends TravenPlugin {
  name = "expand-embed";
  requiredNodes = (
    /** @type {const} */
    ["ExpandEmbedShortcode"]
  );
  decorationPriority = 80;
  /**
   * @param {{ resolve?: ExpandResolver }} [options]
   */
  constructor(options = {}) {
    super();
    this.resolve = typeof options.resolve === "function" ? options.resolve : null;
  }
  getMarkdownConfig() {
    return ExpandEmbedShortcode;
  }
  /**
   * @param {import("@freedomware/traven").DecorationContext | any} ctx
   */
  buildDecorations(ctx) {
    const { state, decorations, cursorInRange, selectionOverlapsRange } = ctx;
    const tree = syntaxTree(state);
    tree.iterate({
      enter: (node) => {
        if (node.name !== "ExpandEmbedShortcode") return;
        if (cursorInRange(node.from, node.to) || selectionOverlapsRange(node.from, node.to)) {
          return;
        }
        const rawText = state.doc.sliceString(node.from, node.to);
        const attrs = parseExpandEmbedAttrs(rawText);
        decorations.push({
          from: node.from,
          to: node.to,
          deco: Decorations.replace({
            widget: new ExpandEmbedWidget({
              mode: attrs.mode,
              slug: attrs.slug,
              heading: attrs.heading,
              text: attrs.text,
              rawText,
              nodeFrom: node.from
            })
            // Inline — must not use block:true (breaks mid-sentence flow).
          })
        });
      }
    });
  }
  /**
   * @param {import("@lezer/common").SyntaxNode} node
   * @param {string} _childrenHtml
   * @param {{ sliceDoc: (from: number, to: number) => string }} ctx
   * @returns {string|null}
   */
  renderToHTML(node, _childrenHtml, ctx) {
    const rawText = ctx.sliceDoc(node.from, node.to);
    const attrs = parseExpandEmbedAttrs(rawText);
    if (!attrs.slug) return "";
    let bodyHtml = null;
    if (this.resolve) {
      try {
        bodyHtml = this.resolve({
          slug: attrs.slug,
          heading: attrs.heading,
          source: attrs.source,
          mode: attrs.mode
        });
      } catch (err) {
        console.warn("ExpandEmbedPlugin resolve failed:", err);
        bodyHtml = null;
      }
    }
    if (bodyHtml === null && this.resolve) {
      return "";
    }
    const label = escapeHtml(expandEmbedLabel(attrs));
    const slugAttr = escapeAttr(attrs.slug);
    const headingAttr = attrs.heading ? ` data-heading="${escapeAttr(attrs.heading)}"` : "";
    const sourceAttr = attrs.source ? ` data-source="${escapeAttr(attrs.source)}"` : "";
    const inner = bodyHtml != null && bodyHtml !== "" ? bodyHtml : `<p class="traven-expand-unresolved">Unresolved reference: ${escapeHtml(attrs.slug)}</p>`;
    if (attrs.mode === "embed") {
      return `<div class="traven-embed" data-slug="${slugAttr}"${headingAttr}${sourceAttr}><div class="traven-embed-content">${inner}</div></div>`;
    }
    const id = nextExpandId();
    return `<button type="button" class="traven-expand-trigger" data-traven-expand="${id}" data-slug="${slugAttr}"${headingAttr}${sourceAttr} aria-expanded="false">${label}</button><template id="${id}">${inner}</template>`;
  }
};
function escapeHtml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(text) {
  return escapeHtml(text).replace(/"/g, "&quot;");
}

// src/modal.js
import { openModal } from "@freedomware/traven";

// src/shortcode-build.js
function escapeAttr2(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
function buildExpandEmbedShortcode(mode, slug, heading2 = null, text = null, source = null) {
  const s = String(slug || "").trim();
  const src = source ? String(source).trim() : "";
  const h = !src && heading2 ? String(heading2).trim() : "";
  const t2 = text ? String(text).trim() : "";
  if (!s) return `[${mode} slug=""]`;
  let out = `[${mode} slug="${escapeAttr2(s)}"`;
  if (t2) out += ` text="${escapeAttr2(t2)}"`;
  if (src) out += ` source="${escapeAttr2(src)}"`;
  else if (h) out += ` heading="${escapeAttr2(h)}"`;
  out += "]";
  return out;
}

// src/modal.js
function attachSlugTypeahead(editor, slugInput, fieldWrap, opts = {}) {
  const suggestHandler = typeof editor.getSuggestLinks === "function" ? editor.getSuggestLinks() : null;
  if (!suggestHandler) {
    if (typeof opts.onSlugChange === "function") {
      let debounceTimer2 = null;
      const onInput2 = () => {
        if (debounceTimer2) clearTimeout(debounceTimer2);
        debounceTimer2 = setTimeout(
          () => opts.onSlugChange(slugInput.value.trim()),
          200
        );
      };
      slugInput.addEventListener("input", onInput2);
      return {
        destroy() {
          if (debounceTimer2) clearTimeout(debounceTimer2);
          slugInput.removeEventListener("input", onInput2);
        }
      };
    }
    return { destroy() {
    } };
  }
  let suggestList = null;
  let debounceTimer = null;
  let requestId = 0;
  let activeIndex = -1;
  let current = [];
  const hide = () => {
    if (suggestList) {
      suggestList.remove();
      suggestList = null;
    }
    activeIndex = -1;
    current = [];
    slugInput.setAttribute("aria-expanded", "false");
  };
  const apply = (item) => {
    const slug = item.slug || "";
    if (slug) slugInput.value = slug;
    if (typeof opts.onPick === "function") opts.onPick(item);
    if (typeof opts.onSlugChange === "function") opts.onSlugChange(slug);
    hide();
    slugInput.focus();
  };
  const render = (items) => {
    hide();
    current = Array.isArray(items) ? items.filter((i) => i && (i.slug || i.url)) : [];
    if (current.length === 0) return;
    suggestList = document.createElement("ul");
    suggestList.className = "traven-link-suggest-list";
    suggestList.setAttribute("role", "listbox");
    suggestList.id = "traven-expand-suggest-list";
    current.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "traven-link-suggest-item";
      li.setAttribute("role", "option");
      li.id = `traven-expand-suggest-${index}`;
      const titleEl = document.createElement("span");
      titleEl.className = "traven-link-suggest-title";
      titleEl.textContent = item.title || item.slug || item.url;
      const metaEl = document.createElement("span");
      metaEl.className = "traven-link-suggest-meta";
      metaEl.textContent = item.slug || item.url;
      li.appendChild(titleEl);
      li.appendChild(metaEl);
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        apply(item);
      });
      suggestList.appendChild(li);
    });
    fieldWrap.appendChild(suggestList);
    slugInput.setAttribute("aria-expanded", "true");
    slugInput.setAttribute("aria-controls", "traven-expand-suggest-list");
  };
  const setActive = (index) => {
    if (!suggestList) return;
    const items = suggestList.querySelectorAll(".traven-link-suggest-item");
    items.forEach((el) => el.classList.remove("is-active"));
    if (index < 0 || index >= items.length) {
      activeIndex = -1;
      slugInput.removeAttribute("aria-activedescendant");
      return;
    }
    activeIndex = index;
    items[index].classList.add("is-active");
    slugInput.setAttribute("aria-activedescendant", `traven-expand-suggest-${index}`);
    items[index].scrollIntoView({ block: "nearest" });
  };
  slugInput.setAttribute("aria-autocomplete", "list");
  slugInput.setAttribute("aria-expanded", "false");
  slugInput.placeholder = "Type a title or slug\u2026";
  const run = async (query) => {
    const id = ++requestId;
    try {
      const result = await suggestHandler(query);
      if (id !== requestId) return;
      render(Array.isArray(result) ? result : []);
    } catch (err) {
      if (id !== requestId) return;
      hide();
      console.warn("onSuggestLinks failed:", err);
    }
  };
  const onInput = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      run(slugInput.value);
      if (typeof opts.onSlugChange === "function") {
        opts.onSlugChange(slugInput.value.trim());
      }
    }, 200);
  };
  const onKeyDown = (e) => {
    if (!suggestList || current.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(activeIndex < current.length - 1 ? activeIndex + 1 : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(activeIndex <= 0 ? current.length - 1 : activeIndex - 1);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      apply(current[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      hide();
    }
  };
  const onBlur = () => setTimeout(() => hide(), 150);
  slugInput.addEventListener("input", onInput);
  slugInput.addEventListener("keydown", onKeyDown);
  slugInput.addEventListener("blur", onBlur);
  return {
    destroy() {
      if (debounceTimer) clearTimeout(debounceTimer);
      slugInput.removeEventListener("input", onInput);
      slugInput.removeEventListener("keydown", onKeyDown);
      slugInput.removeEventListener("blur", onBlur);
      hide();
    }
  };
}
var EXPAND_TARGET_DECK = "__deck__";
function resetTargetSelect(select, disabled = true) {
  select.innerHTML = "";
  const whole = document.createElement("option");
  whole.value = "";
  whole.textContent = "Whole post";
  select.appendChild(whole);
  select.value = "";
  select.disabled = disabled;
}
function fillTargetSelect(select, targets, preserveValue = "", includeDeck = false) {
  resetTargetSelect(select, false);
  const seen = /* @__PURE__ */ new Set([""]);
  const deck = includeDeck ? String(targets?.deck || "").trim() : "";
  if (deck) {
    const opt = document.createElement("option");
    opt.value = EXPAND_TARGET_DECK;
    opt.textContent = "Summary";
    select.appendChild(opt);
    seen.add(EXPAND_TARGET_DECK);
  }
  for (const item of targets?.headings || []) {
    const title = String(item?.title || "").trim();
    if (!title || seen.has(title)) continue;
    seen.add(title);
    const opt = document.createElement("option");
    opt.value = title;
    const level = item.level ? Number(item.level) : 0;
    opt.textContent = level > 0 ? `${"\xA0".repeat((level - 1) * 2)}${title}` : title;
    select.appendChild(opt);
  }
  if (preserveValue && seen.has(preserveValue)) {
    select.value = preserveValue;
  } else {
    select.value = "";
  }
}
function fillHeadingSelect(select, headings, preserveValue = "") {
  fillTargetSelect(select, { headings }, preserveValue, false);
}
function targetValueToAttrs(value) {
  const v = String(value || "").trim();
  if (!v) return { heading: null, source: null };
  if (v === EXPAND_TARGET_DECK) return { heading: null, source: "deck" };
  return { heading: v, source: null };
}
function openExpandEmbedModal(editor, triggerBtn, mode = "expand") {
  const isEmbed = mode === "embed";
  const form = document.createElement("div");
  const textField = document.createElement("div");
  textField.className = "traven-modal-field";
  textField.innerHTML = `
    <label class="traven-modal-label" for="traven-expand-text">Link Text</label>
    <input type="text" id="traven-expand-text" class="traven-modal-input" placeholder="Visible link label" value="" autocomplete="off" />
  `;
  form.appendChild(textField);
  const slugField = document.createElement("div");
  slugField.className = "traven-modal-field";
  slugField.style.position = "relative";
  slugField.innerHTML = `
    <label class="traven-modal-label" for="traven-expand-slug">Post / page</label>
    <input type="text" id="traven-expand-slug" class="traven-modal-input" placeholder="slug" value="" autocomplete="off" />
  `;
  form.appendChild(slugField);
  const listExpandTargetsHandler = typeof editor.getListExpandTargets === "function" ? editor.getListExpandTargets() : null;
  const listHeadingsHandler = typeof editor.getListHeadings === "function" ? editor.getListHeadings() : null;
  const useExpandTargets = typeof listExpandTargetsHandler === "function";
  const useHeadingSelect = useExpandTargets || typeof listHeadingsHandler === "function";
  const targetLabel = useExpandTargets ? "Target" : "Heading (optional)";
  const headingField = document.createElement("div");
  headingField.className = "traven-modal-field";
  if (useHeadingSelect) {
    headingField.innerHTML = `
      <label class="traven-modal-label" for="traven-expand-heading">${targetLabel}</label>
      <select id="traven-expand-heading" class="traven-modal-input" disabled>
        <option value="">Whole post</option>
      </select>
    `;
  } else {
    headingField.innerHTML = `
      <label class="traven-modal-label" for="traven-expand-heading">Heading (optional)</label>
      <input type="text" id="traven-expand-heading" class="traven-modal-input" placeholder="Section heading \u2014 leave blank for whole post" value="" autocomplete="off" />
    `;
  }
  form.appendChild(headingField);
  const hint = document.createElement("p");
  hint.className = "traven-expand-modal-hint";
  hint.style.margin = "0";
  hint.style.fontSize = "0.8em";
  hint.style.color = "var(--text-secondary, #64748b)";
  if (useExpandTargets) {
    hint.textContent = isEmbed ? "Embed always shows the target in place. Target: whole post, Summary (deck), or a section. Link Text labels the editor chip." : "Expand stays collapsed until the reader opens it (Nutshell-style). Target: whole post, Summary (deck), or a section. Link Text is the clickable label.";
  } else {
    hint.textContent = isEmbed ? "Embed always shows the target content in place. Heading selects a section; Link Text labels the editor chip." : "Expand stays collapsed until the reader opens it (Nutshell-style). Heading selects a section; Link Text is the clickable label.";
  }
  form.appendChild(hint);
  const textInput = (
    /** @type {HTMLInputElement} */
    form.querySelector("#traven-expand-text")
  );
  const slugInput = (
    /** @type {HTMLInputElement} */
    form.querySelector("#traven-expand-slug")
  );
  const headingControl = (
    /** @type {HTMLInputElement|HTMLSelectElement} */
    form.querySelector("#traven-expand-heading")
  );
  const view = typeof editor.getView === "function" ? editor.getView() : null;
  if (view && view.state && view.state.selection) {
    const { from, to } = view.state.selection.main;
    const selectionText = from !== to ? view.state.sliceDoc(from, to) : "";
    if (selectionText) {
      textInput.value = selectionText;
    }
  }
  let targetRequestId = 0;
  const refreshTargets = async (slug) => {
    if (!useHeadingSelect) return;
    const select = (
      /** @type {HTMLSelectElement} */
      headingControl
    );
    const s = String(slug || "").trim();
    if (!s) {
      resetTargetSelect(select, true);
      return;
    }
    const preserve = select.value;
    const id = ++targetRequestId;
    select.disabled = true;
    try {
      if (useExpandTargets) {
        const result = await listExpandTargetsHandler(s);
        if (id !== targetRequestId) return;
        const targets = result && typeof result === "object" && !Array.isArray(result) ? {
          deck: result.deck ?? null,
          headings: Array.isArray(result.headings) ? result.headings : []
        } : { deck: null, headings: [] };
        fillTargetSelect(select, targets, preserve, true);
      } else {
        const result = await listHeadingsHandler(s);
        if (id !== targetRequestId) return;
        fillHeadingSelect(select, Array.isArray(result) ? result : [], preserve);
      }
    } catch (err) {
      if (id !== targetRequestId) return;
      resetTargetSelect(select, false);
      console.warn(
        useExpandTargets ? "onListExpandTargets failed:" : "onListHeadings failed:",
        err
      );
    }
  };
  const typeahead = attachSlugTypeahead(editor, slugInput, slugField, {
    onPick: (item) => {
      if (!textInput.value.trim() && item.title) {
        textInput.value = item.title;
      }
    },
    onSlugChange: (slug) => {
      refreshTargets(slug);
    }
  });
  openModal({
    title: isEmbed ? "Insert Embed" : "Insert Expand",
    body: form,
    triggerElement: triggerBtn,
    className: "traven-modal-expand-embed",
    onClose: () => {
      typeahead.destroy();
      const v = editor.getView && editor.getView();
      if (v && typeof v.requestMeasure === "function") {
        v.requestMeasure();
      }
    },
    buttons: [
      {
        text: "Cancel",
        type: "secondary",
        onClick: (_e, overlay) => {
          overlay.querySelector(".traven-modal-close").click();
        }
      },
      {
        text: "Insert",
        type: "primary",
        onClick: (_e, overlay) => {
          const slug = slugInput.value.trim();
          if (!slug) {
            slugInput.focus();
            slugInput.classList.add("traven-modal-input-error");
            return;
          }
          const rawTarget = headingControl.value.trim();
          const { heading: heading2, source } = useExpandTargets ? targetValueToAttrs(rawTarget) : { heading: rawTarget || null, source: null };
          const linkText = textInput.value.trim() || null;
          const md = buildExpandEmbedShortcode(mode, slug, heading2, linkText, source);
          if (typeof editor.replaceSelection === "function") {
            editor.replaceSelection(md);
          } else if (typeof editor.insertSnippet === "function") {
            editor.insertSnippet("", "", md);
          }
          overlay.querySelector(".traven-modal-close").click();
        }
      }
    ]
  });
  requestAnimationFrame(() => {
    if (textInput.value.trim()) slugInput.focus();
    else textInput.focus();
  });
}

// src/tools.js
var ICON_EXPAND = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M216,112v16c0,53-88,88-88,112,0-24-88-59-88-112V112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M80,56h96a48,48,0,0,1,48,48v0a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8v0A48,48,0,0,1,80,56Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M128,56V48a32,32,0,0,1,32-32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`;
var ICON_EMBED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M160,80,76.69,164.69a16,16,0,0,0,22.63,22.62L198.63,86.63a32,32,0,0,0-45.26-45.26L54.06,142.06a48,48,0,0,0,67.88,67.88L204,128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`;
var expandEmbedTools = {
  expand: {
    key: "expand",
    title: "Expand",
    icon: ICON_EXPAND,
    action: (editor, buttonEl) => openExpandEmbedModal(editor, buttonEl, "expand")
  },
  embed: {
    key: "embed",
    title: "Embed",
    icon: ICON_EMBED,
    action: (editor, buttonEl) => openExpandEmbedModal(editor, buttonEl, "embed")
  }
};
var EXPAND_EMBED_TOOLBAR = ["expand", "embed"];

// src/runtime.js
var TRAILING_PUNCT_RE = /^([.,:;!?])(?:\s|$)/;
function initExpandEmbed(root = document) {
  const scope = (
    /** @type {ParentNode & { querySelectorAll?: Function }} */
    root
  );
  if (!scope || typeof scope.querySelectorAll !== "function") return;
  const triggers = scope.querySelectorAll(".traven-expand-trigger");
  for (const trigger of triggers) {
    if (!(trigger instanceof HTMLElement)) continue;
    if (trigger.dataset.travenExpandBound === "1") continue;
    trigger.dataset.travenExpandBound = "1";
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      toggleExpandTrigger(trigger);
    });
  }
}
function positionExpandArrow(trigger, panel) {
  const arrow = panel.querySelector(".traven-expand-panel-arrow");
  if (!(arrow instanceof HTMLElement)) return;
  const t2 = trigger.getBoundingClientRect();
  const p = panel.getBoundingClientRect();
  if (p.width <= 0) return;
  const half = 11;
  let left = t2.left + t2.width / 2 - p.left - half;
  const min = 16;
  const max = Math.max(min, p.width - 16 - half * 2);
  left = Math.min(Math.max(left, min), max);
  arrow.style.left = `${left}px`;
}
function nextSignificantSibling(start) {
  let n = start;
  while (n) {
    if (n instanceof HTMLElement) {
      if (n.tagName === "TEMPLATE") {
        n = n.nextSibling;
        continue;
      }
      if (n.classList.contains("traven-expand-panel") && n.hidden) {
        n = n.nextSibling;
        continue;
      }
    }
    if (n.nodeType === Node.TEXT_NODE && !(n.nodeValue || "").length) {
      n = n.nextSibling;
      continue;
    }
    return n;
  }
  return null;
}
function ensureTrailingPunctuation(trigger) {
  const immediate = trigger.nextSibling;
  if (immediate instanceof HTMLElement && immediate.classList.contains("traven-expand-punct")) {
    return immediate;
  }
  const next = nextSignificantSibling(immediate);
  if (next instanceof HTMLElement && next.classList.contains("traven-expand-panel")) {
    return null;
  }
  if (!next || next.nodeType !== Node.TEXT_NODE) return null;
  const value = next.nodeValue || "";
  const match = value.match(TRAILING_PUNCT_RE);
  if (!match) return null;
  const punct = document.createElement("span");
  punct.className = "traven-expand-punct";
  punct.textContent = match[1];
  next.nodeValue = value.slice(match[1].length);
  trigger.after(punct);
  return punct;
}
function toggleExpandTrigger(trigger) {
  const id = trigger.getAttribute("data-traven-expand");
  if (!id) return;
  const panelId = `traven-expand-panel-${id}`;
  let panel = document.getElementById(panelId);
  const isOpen = trigger.getAttribute("aria-expanded") === "true";
  if (isOpen) {
    trigger.setAttribute("aria-expanded", "false");
    if (panel) {
      panel.hidden = true;
    }
    return;
  }
  if (!panel) {
    const template = document.getElementById(id);
    if (!(template instanceof HTMLTemplateElement)) return;
    panel = document.createElement("div");
    panel.id = panelId;
    panel.className = "traven-expand-content traven-expand-panel";
    panel.setAttribute("role", "region");
    const arrow = document.createElement("div");
    arrow.className = "traven-expand-panel-arrow";
    arrow.setAttribute("aria-hidden", "true");
    panel.appendChild(arrow);
    panel.appendChild(template.content.cloneNode(true));
  }
  const punct = ensureTrailingPunctuation(trigger);
  const anchor = punct || trigger;
  if (anchor.nextSibling !== panel) {
    anchor.after(panel);
  }
  panel.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => {
    positionExpandArrow(trigger, panel);
  });
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initExpandEmbed());
  } else {
    initExpandEmbed();
  }
}
export {
  EXPAND_EMBED_TOOLBAR,
  ExpandEmbedPlugin,
  ExpandEmbedShortcode,
  buildExpandEmbedShortcode,
  expandEmbedLabel,
  expandEmbedTools,
  initExpandEmbed,
  openExpandEmbedModal,
  parseExpandEmbedAttrs
};
