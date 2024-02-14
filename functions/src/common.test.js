const algo = require('./common');

describe('Pairings', () => {
  it("should prevent a single group from pairing", () => {
    const pairings = algo.generatePairings(
        [
            {
                isOneWay: false,
                people: ["a", "b"],
            }
        ],
        [ "a", "b", "c", "d" ]
    );

    expect(pairings["a"]).not.toEqual("b");
    expect(pairings["b"]).not.toEqual("a");
  });

  it("should prevent multiple groups from pairing", () => {
    // a must have d (and vice versa)
    expect(
        algo.generatePairings(
            [
                {
                    isOneWay: false,
                    people: ["a", "b"],
                },
                {
                    isOneWay: false,
                    people: ["a", "c"],
                }
            ],
            [ "a", "b", "c", "d" ]
        )
    ).toEqual(
        { a: "d", b: "c", c: "b", d: "a" }
    );
  });

  it("should prevent one-way pairings", () => {
    // can't go a->b->c
    expect(
        algo.generatePairings(
            [
                {
                    isOneWay: true,
                    people: ["a", "b"],
                },
                {
                    isOneWay: true,
                    people: ["b", "c"],
                },
                {
                    isOneWay: true,
                    people: ["c", "a"],
                }
            ],
            [ "a", "b", "c" ]
        )
    ).toEqual(
        // note that all of these have one-way restrictions
        // in the other direction
        { a: "c", b: "a", c: "b" }
    );
  });
});
