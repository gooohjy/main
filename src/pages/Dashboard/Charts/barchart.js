import { Bar } from 'vue-chartjs'
import { db } from '../../../firebase/firebaseConfig'

export default{
    extends: Bar,
    data: () => ({
        datacollection: {
            datasets: [{
                label: 'Contribution %',
                yAxisID: 'B',
                type: 'line',
                fill: false,
                showLine: false,
                data:[],
                borderWidth: 1,
                borderColor: "grey",
                pointRadius: 10,
                borderWidth: 1
            },
            {
                label: 'Active Tasks',
                yAxisID: 'A',
                data:[],
                backgroundColor:[]
            }
            ],
            labels:[]
        },
        options: {
            legend: {
                display: false
            },
            layout:{
                padding:{
                    left: 5,
                    right: 0,
                    top: 10,
                    bottom: 0
                }
            },
            scales:{
                yAxes:[{
                    id: 'A',
                    position: 'left',
                    scaleLabel: {
                        display: true,
                        labelString: 'Active Task Count'
                    },
                    type: 'linear',
                    ticks:{
                        min:0
                    },
                    gridLines: {
                        display:false
                    }
                },
                {
                    id:'B',
                    position: 'right',
                    type: 'linear',
                    scaleLabel: {
                        display: true,
                        labelString: 'Personal Contribution (%)'
                    },
                    ticks:{
                        min:0
                    }
                }
                ]
            },
            responsive: true,
            maintainAspectRatio: false
        },
        projects: {
            projectData: {}, //Gives us a list of currently active projects 
            TaskCounts: {}
        }  
    }),
    methods: {
            fetchItems: function() {
                var today = new Date();

                var projects = {}; // Initialise this to do a "join" between collections

                // Filter by Projects && Modules
                db.collection('projects').get().then(querySnapShot => {
                    querySnapShot.forEach(doc => {
                        var mod = doc.data().module
                        var projectName = doc.data().projectName
                        var id = doc.id
                        var projDue = new Date(doc.data().dueDate)
                        if (id in projects == false && +projDue >= +today) {
                            projects[id] = mod + " - " + projectName
                        }
                    })
                    Object.keys(projects).forEach(key => {
                        this.projects.projectData[key] = projects[key] //May want to push project Name into labels
                    })
                })

                //need to fill colour with the module code, x-axis is the assignment 
                // y axis -> task count , contribution %
                var desired = "Jia Yi"
                var dict = {};
                var TaskCounts = {};

                db.collection('tasks').get().then(querySnapShot => { 
                    querySnapShot.forEach(doc => {
                        var user = doc.data().assignee.username
                        var proj = doc.data().projectId
                        var docDate = new Date(doc.data().date)
                        if(+docDate >= +today) { // Typecast to numbers, filter out records that have been past date
                            if (proj in dict) {
                                dict[proj] +=  1
                            } else {
                                dict[proj] =  1
                            }
                        }
                        if (proj in TaskCounts) {
                            TaskCounts[proj][0] += 1
                        } else {
                            TaskCounts[proj] = [1,0]
                        }

                        if(user == desired) {
                            if(proj in TaskCounts) {
                                TaskCounts[proj][1] += 1
                             }
                        }
                    })
                Object.keys(dict).forEach(key => {
                    if (this.projects.projectData[key] != null){
                        this.datacollection.datasets[1].data.push(dict[key])
                        this.datacollection.labels.push(this.projects.projectData[key])
                        var colour = this.pastelColors()
                        this.datacollection.datasets[1].backgroundColor.push(colour)
                    }
                })

                Object.keys(TaskCounts).forEach(key => {
                    if (this.projects.projectData[key] != null){
                        this.projects.TaskCounts[key] = TaskCounts[key]
                        var percent = (TaskCounts[key][1]/TaskCounts[key][0]) * 100
                        this.datacollection.datasets[0].data.push((Math.round(percent * 10) / 10).toFixed(1))  
                    }
                })
                this.renderChart(this.datacollection, this.options)
            })
        },
        pastelColors: function(){
            var r = (Math.round(Math.random()* 127) + 127).toString(16);
            var g = (Math.round(Math.random()* 127) + 127).toString(16);
            var b = (Math.round(Math.random()* 127) + 127).toString(16);
            return '#' + r + g + b;
        }
    },
    created(){
        this.fetchItems()
    }
}
