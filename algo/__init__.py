def dynamic_programming(f):
    def deco(*args, **kwargs):
        print("** Solving with Dynamic Programming **")
        return f(*args, **kwargs)
    return deco
