import { db } from "./db";
import { poems } from "@shared/schema";

async function seedDatabase() {
  try {
    console.log("Seeding database with initial poems...");
    
    const initialPoems = [
      {
        title: "Having a Coke With You",
        slug: "having-a-coke-with-you",
        year: 1960,
        externalLink: "https://www.poetryfoundation.org/poems/42665/having-a-coke-with-you",
        context: `is even more fun than going to San Sebastian, Irún, Hendaye, Biarritz, Bayonne
or being sick to my stomach on the Travesera de Gracia in Barcelona
partly because in your orange shirt you look like a better happier St. Sebastian
partly because of my love for you, partly because of your love for yoghurt
partly because of the fluorescent orange tulips we picked from somebody's yard
partly because of the secluded table in the Bronx we found for brunch
partly because of the way you write down your dreams in the morning
partly because when I take you in my arms now your shoulders are too thin
I don't know any of these things I feel or think but I do know that
partly because the ache I had when you went to live with her in Cambridge is gone
partly because I like you partly because of my embarrassing loudness  
I don't know why I tell you about it or even that it exists
but mostly because I am happy that you exist and you are listening
and mostly waiting for the fireworks which we have to feel any minute and ignite the rain
we don't have to think of stormy weather
if we do we'll wish we were both there
walking down the moist pavements in the rain, Washington Square, the children laughing and playing games
and the way your hair falls in your face when you take off your hat
and the way you hold my hand and swing our arms so freely
as if I were a kid again an in love for the first time
and the way your smile takes over your whole face
partly because the world is dumb and forgets that the heart exists
partly because when I am sad you are the only one who notices the exact degree of my sadness and says something unusually perfect`,
      },
      {
        title: "Ave Maria", 
        slug: "ave-maria",
        year: 1964,
        externalLink: "https://www.poetryfoundation.org/poems/42666/ave-maria",
        context: `Mothers of America
                        let your kids go to the movies!
get them out of the house so they won't know what you're up to
it's true that fresh air is good for the body
                        but what about the soul
that grows in darkness, embossed by silvery images
and when you grow old as grow old you must
                        they won't hate you
they will be in some glamorous country
they first saw on a Saturday afternoon or playing hooky
they may even be grateful to you
                        for their first sexual experience
which only cost you a quarter
and didn't upset the peaceful home
they will know where candy bars come from
                        and gratuitous bags of popcorn
as gratuitous as leaving the movie before it's over
with a pleasant stranger whose apartment is in the Heaven on Earth Bldg
near the Williamsburg Bridge
                        oh mothers you will have made the little tykes
so happy because if nobody does pick them up in the movies
they won't know the difference
                        and if somebody does it'll be sheer gravy
and they'll have been truly entertained either way
instead of hanging around the yard
                        or up in their room
hating you
prematurely since you won't have done anything horribly mean yet
except keeping them from the darker joys
                        that's where we learn to be good at the heart
                        because the heart, the heart
            is only a muscle`
      }
    ];

    for (const poem of initialPoems) {
      await db.insert(poems).values(poem).onConflictDoNothing();
    }
    
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

seedDatabase();