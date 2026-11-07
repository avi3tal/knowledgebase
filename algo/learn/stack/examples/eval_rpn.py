"""Worked example (plain stack): evaluate an expression in reverse Polish (postfix) notation.

Reference code for the lesson animation; `# note:` comments become the narration.
"""


def eval_rpn(tokens: list[str]) -> int:
    stack: list[int] = []
    for i in range(len(tokens)):
        tok = tokens[i]
        if tok not in {"+", "-", "*", "/"}:
            stack.append(int(tok))  # note: an operand: push it and wait for its operator
            continue
        right = stack.pop()  # note: an operator: the two most recent operands are on top (right first!)
        left = stack.pop()
        if tok == "+":
            stack.append(left + right)  # note: push the result back — it is an operand for a later operator
        elif tok == "-":
            stack.append(left - right)
        elif tok == "*":
            stack.append(left * right)  # note: push the result back — it is an operand for a later operator
        else:
            stack.append(int(left / right))  # note: division truncates toward zero
    return stack[-1]  # note: a well-formed expression leaves exactly one value
