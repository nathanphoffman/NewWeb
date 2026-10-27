<!-- themes: cats -->
# Deor Language Highlight Test

A sample of the **deor** language with syntax highlighting:

```deor
# comments look like this

type Roll(int n)
    n >= 1 and n <= 100

type Sides(int n)
    n >= 2

struct Die
    Sides sides
    string label

struct+ RollResult
    Roll value
    string source

fn RollResult roll_die(Die die)
    (sides, label) in die

    int raw = rand(1, sides)
    Roll value = raw
    string source = label
    result as (value, source)

    return result

fn list<RollResult> roll_many(Die die, int count)
    list<RollResult> results = []

    for i in range(count)
        RollResult r = roll_die(die)
        results insert r

    return results

fn int sum_rolls(list<RollResult> rolls)
    sum as 0

    for roll in rolls
        value in roll
        sum = sum + (value is known)

    return sum

fn bool is_critical(RollResult r)
    value in r
    return (value is known) == 20

fn main()
    sides as 20
    label as "d20"
    d20 as (sides, label)

    RollResult attack = roll_die(d20)
    Roll crit = find_crit_value([attack])
    int crit_bonus = crit else 0
    print(crit_bonus)
```

A sample exercising the newer grammar constructs (types, macros, string interpolation):

```deor
const private raw

enum dieFace
    one
    two

shape rollConfig
    int sides
    bool advantage

fn RollResult roll_die(Die die)
    assert!(sides > 0)
    print("rolling a d{sides}\n")

    for i in range(sides)
        if i == 0
            continue
        break

    return result
```

Compare with an unlabeled block (no highlighting):

```
fn main()
    print("no language tag")
```
